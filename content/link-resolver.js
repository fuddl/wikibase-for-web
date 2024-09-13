class MovementObserver {
	constructor(callback) {
		this.callback = callback;
		this.observedElements = new Map(); // Store observed elements and their previous locations
		this.checkPosition = this.checkPosition.bind(this);
	}

	observe(element) {
		if (this.observedElements.has(element)) return; // If already observing, skip
		const rect = element.getBoundingClientRect();
		this.observedElements.set(element, rect);

		// Start tracking using `requestAnimationFrame`
		if (this.observedElements.size === 1) {
			this.startTracking();
		}
	}

	unobserve(element) {
		this.observedElements.delete(element);

		// If there are no elements left to track, stop the tracking
		if (this.observedElements.size === 0) {
			this.stopTracking();
		}
	}

	disconnect() {
		this.observedElements.clear();
		this.stopTracking();
	}

	startTracking() {
		this.tracking = true;
		this.checkPosition();
	}

	stopTracking() {
		this.tracking = false;
	}

	checkPosition() {
		if (!this.tracking) return;

		this.observedElements.forEach((prevRect, element) => {
			const currentRect = element.getBoundingClientRect();

			if (
				prevRect.top !== currentRect.top ||
				prevRect.left !== currentRect.left ||
				prevRect.width !== currentRect.width ||
				prevRect.height !== currentRect.height
			) {
				this.callback([{ target: element, prevRect, currentRect }]);
				this.observedElements.set(element, currentRect); // Update with new position
			}
		});

		// Use `requestAnimationFrame` for continuous checking
		requestAnimationFrame(this.checkPosition);
	}
}

class LinkResolver {
	constructor() {
		this.currentEdits = [];
		this.groupedLinks = this.groupLinksByUrl();
		this.observer = null;
		this.shadowRoot = null; // To store the shadow DOM
		this.linksRoot = null;
		this.linkRectsMap = new Map(); // To track link and its visual representation
		this.movementObserver = null; // Movement observer for links
		this.linkGroupMap = new Map(); // To map links to their groups
		this.visualizer = document.createElement('div');
		this.visualizer.style.position = 'absolute';
		this.visualizer.style.top = '0';
		this.visualizer.style.left = '0';
		this.visualizer.style.width = '100%';
		this.visualizer.style.height = '100%';
		this.visualizer.style.pointerEvents = 'none';
		this.visualizer.style.zIndex = '9999'; // Ensure it's on top of the page content

		this.shadowRoot = this.visualizer.attachShadow({ mode: 'open' });

		// Inject a stylesheet into the shadow DOM
		const style = document.createElement('link');
		style.rel = 'stylesheet';
		style.href = browser.runtime.getURL('content/link-resolver.css');
		this.shadowRoot.appendChild(style); // Add the stylesheet to the shadow DOM

		// Initialize the linksRoot after attaching shadowRoot
		this.linksRoot = document.createElement('div');
		this.shadowRoot.appendChild(this.linksRoot);
		this.active = false;

		this.typePatternMap = {
			item: /Q\d+$/,
			lexeme: /L\d+$/,
			sense: /L\d+-S\d+$/,
			form: /L\d+-F\d+$/,
			property: /P\d+$/,
		};
	}

	setJobs(edits) {
		this.currentEdits = edits;
		if (this.isVisible()) {
			this.rebuildVisualizer();
		}
	}

	// Group links by their URL
	groupLinksByUrl() {
		const linksArray = Array.from(document.links); // Convert document.links to an array
		const linkMap = new Map(); // To store unique URLs and corresponding elements

		linksArray.forEach(link => {
			const url = link.href; // Get the URL of the link
			if (!linkMap.has(url)) {
				linkMap.set(url, []); // Initialize an array for this URL if not already present
			}
			linkMap.get(url).push(link); // Add the element to the array for this URL
		});

		// Convert the Map to an array of objects
		return Array.from(linkMap.entries()).map(([url, elements]) => ({
			url,
			elements,
			resolved: [], // Add a resolved property to track resolved items
		}));
	}

	// Observe visibility of links and execute the callback when triggered
	observeLinkVisibility(callback) {
		this.observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const link = entry.target;
						// Find which group the link belongs to
						const group = this.groupedLinks.find(group =>
							group.elements.includes(link),
						);

						if (group && !group._hasTriggered) {
							group._hasTriggered = true; // Mark the group as triggered
							callback(group); // Execute the callback for the group
						}
					}
				});
			},
			{
				root: null, // Use the browser viewport as the container
				threshold: 0.1, // Trigger when at least 10% of the link is visible
			},
		);

		// Observe each link in all groups
		this.groupedLinks.forEach(group => {
			group._hasTriggered = false; // Track whether the group has been triggered
			group.elements.forEach(link => {
				this.observer.observe(link); // Start observing each link element
			});
		});
	}

	async handleGroupVisibility(group, retryCount = 3, delay = 1000) {
		const candidates = await browser.runtime.sendMessage({
			type: 'request_resolve',
			url: group.url,
		});

		if (candidates && candidates.length > 0) {
			const firstCandidate = candidates[0];

			group.resolved =
				firstCandidate.resolved.filter(resolved => {
					if (!this?.restrictors?.blacklist && !this?.restrictors?.types) {
						return true;
					}

					if (this?.restrictors?.blacklist?.includes(resolved.id)) {
						return false;
					}

					if (this?.restrictors?.types) {
						const pattern = this.typePatternMap[this.restrictors.types];
						return pattern.test(resolved.id);
					}

					return true;
				}).length > 0
					? [firstCandidate]
					: [];
		}

		// If no candidates were resolved and we haven't exhausted retries, retry after a delay
		if (group.resolved.length === 0 && retryCount > 0) {
			if (this.active) {
				setTimeout(() => {
					this.handleGroupVisibility(group, retryCount - 1, delay);
				}, delay);
			}
		} else {
			// Rebuild the visualizer once done or if retries are exhausted
			this.rebuildVisualizer();
		}
	}

	isVisible() {
		return this.visualizer.parentElement;
	}

	// Rebuild the link visualizer
	rebuildVisualizer() {
		// Check if the visualizer exists, if not, create and initialize it
		if (!this.isVisible()) {
			// Attach the shadow DOM

			// Append the visualizer to the body
			document.body.appendChild(this.visualizer);
		} else if (this.linksRoot) {
			// Clear previous content if the visualizer exists
			this.linksRoot.innerHTML = '';
		}

		// Create a movement observer to track changes to link size/position
		this.movementObserver = new MovementObserver(entries => {
			entries.forEach(entry => {
				this.updateLinkVisual(entry.target); // Group will be fetched from the map
			});
		});

		// Add a visual representation for each link in groups with resolved items
		this.groupedLinks.forEach(group => {
			if (group?.resolved?.length > 0) {
				group.elements.forEach(link => {
					// Track the link for movement observation
					this.movementObserver.observe(link);

					// Map the link to its group
					this.linkGroupMap.set(link, group);

					// Initial setup of the visual rectangles
					this.updateLinkVisual(link);
				});
			}
		});
	}

	isIdInJobs(jobs, resolve) {
		// Extract the resolved id from the resolve object
		const resolvedId = resolve[0]?.resolved[0]?.id;

		// Check if the resolvedId exists in any of the job claims
		return jobs.some(job => {
			// Check if the job has a claim and the appropriate value
			return job.claim?.mainsnak?.datavalue?.value?.id === resolvedId;
		});
	}

	// Update the visual representation of the link (handles line breaks)
	updateLinkVisual(link) {
		// Remove existing highlights for this link
		this.removeLinkVisuals(link);

		// Get all the client rectangles (to handle line breaks)
		const rects = link.getClientRects();

		for (const rect of rects) {
			const linkElement = document.createElement('button');
			linkElement.classList.add('link-visual');

			linkElement.style.top = `${rect.top + window.scrollY}px`;
			linkElement.style.left = `${rect.left + window.scrollX}px`;
			linkElement.style.width = `${rect.width}px`;
			linkElement.style.height = `${rect.height}px`;

			// Get the group from the linkGroupMap
			const group = this.linkGroupMap.get(link);

			const active = this.isIdInJobs(this.currentEdits, group.resolved);

			if (active) {
				linkElement.classList.add('link-visual--active');
			}

			// Add hover event to add class to all links in the same group
			linkElement.addEventListener('mouseover', () => {
				group.elements.forEach(otherLink => {
					// Get the associated visual elements for each link in the group
					const visuals = this.linkRectsMap.get(otherLink);
					if (visuals) {
						visuals.forEach(visual =>
							visual.classList.add('link-visual--hovered'),
						);
					}
				});
			});

			// Remove class when mouse leaves
			linkElement.addEventListener('mouseleave', () => {
				group.elements.forEach(otherLink => {
					// Get the associated visual elements for each link in the group
					const visuals = this.linkRectsMap.get(otherLink);
					if (visuals) {
						visuals.forEach(visual =>
							visual.classList.remove('link-visual--hovered'),
						);
					}
				});
			});

			// Pass the group to the event listener for clicks
			linkElement.addEventListener('click', async () => {
				const section = getClosestIdentifier(link);
				let closestHeadline = getClosestHeadlineText(link);

				await browser.runtime.sendMessage({
					type: 'resolve_selected',
					candidates: group.resolved,
					source: {
						location: `${window.location.toString()}${section ? `#${section}` : ''}`,
						section:
							closestHeadline && document.title.includes(closestHeadline)
								? null
								: closestHeadline,
						title: document.title,
						lang: document.documentElement.lang ?? 'und',
					},
				});
			});

			// Append this visual element to the shadow DOM
			this.linksRoot.appendChild(linkElement);

			// Keep track of the visuals for this link
			if (!this.linkRectsMap.has(link)) {
				this.linkRectsMap.set(link, []);
			}

			this.linkRectsMap.get(link).push(linkElement);
		}
	}

	// Remove the visual elements for a link when the link is updated
	removeLinkVisuals(link) {
		if (this.linkRectsMap.has(link)) {
			const visuals = this.linkRectsMap.get(link);
			visuals.forEach(visual => {
				if (visual.parentNode) {
					visual.parentNode.removeChild(visual);
				}
			});
			this.linkRectsMap.delete(link); // Remove from map
		}
	}

	// Initialize the observer and pass the callback for group visibility
	init({ restrictors }) {
		this.restrictors = restrictors;
		this.observeLinkVisibility(group => this.handleGroupVisibility(group));
		this.active = true;
	}

	// Destroy the LinkResolver
	clear() {
		this.visualizer.remove();
		this.active = false;
	}
}

let highlightedJobs = null;
let linkResolver = new LinkResolver();

browser.runtime.onMessage.addListener((data, sender) => {
	if (data.type === 'highlight_links') {
		linkResolver.init({
			restrictors: data?.restrictors,
		}); // Initialize the LinkResolver
		return Promise.resolve('done');
	}

	if (data.type === 'unhighlight_links') {
		linkResolver.clear(); // Destroy the LinkResolver
		return Promise.resolve('done');
	}

	if (data.type === 'highlight_jobs') {
		linkResolver.setJobs(data.edits);
		return Promise.resolve('done');
	}

	return false;
});
