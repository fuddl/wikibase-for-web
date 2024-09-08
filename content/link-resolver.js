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
	constructor({ restrictors }) {
		this.groupedLinks = this.groupLinksByUrl();
		this.observer = null;
		this.visualizer = null; // For the link visualizer
		this.shadowRoot = null; // To store the shadow DOM
		this.linksRoot = null;
		this.linkRectsMap = new Map(); // To track link and its visual representation
		this.movementObserver = null; // Movement observer for links
		this.linkGroupMap = new Map(); // To map links to their groups
		this.restrictors = restrictors;
		this.typePatternMap = {
			item: /Q\d+$/,
			lexeme: /L\d+$/,
			sense: /L\d+-S\d+$/,
			form: /L\d+-F\d+$/,
			property: /P\d+$/,
		};
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

	// Callback function to handle group visibility
	async handleGroupVisibility(group) {
		for (const link of group.elements) {
			const candidates = await browser.runtime.sendMessage({
				type: 'request_resolve',
				url: group.url,
			});

			if (candidates) {
				group.resolved = candidates.filter(
					candidate =>
						candidate.resolved.filter(resolved => {
							// If neither blacklist nor types are set, allow all
							if (!this?.restrictors?.blacklist && !this?.restrictors?.types) {
								return true;
							}

							// If there's a blacklist, exclude blacklisted items
							if (this?.restrictors?.blacklist?.includes(resolved.id)) {
								return false;
							}

							// If types are specified, check if the resolved ID matches any allowed type patterns
							if (this?.restrictors?.types) {
								// Check if the resolved ID matches any of the allowed types' patterns
								return this.restrictors.types.some(type => {
									const pattern = this.typePatternMap[type];
									return pattern && pattern.test(resolved.id);
								});
							}

							// If no types or blacklist conditions apply, allow by default
							return true;
						}).length > 0,
				);
			}
		}

		// After the group is resolved, rebuild the visualizer
		this.rebuildVisualizer();
	}

	// Rebuild the link visualizer
	rebuildVisualizer() {
		// Clear the current visualizer if it exists
		if (this.visualizer && this.linksRoot) {
			this.linksRoot.innerHTML = ''; // Clear previous content
		} else {
			// Set up the visualizer and shadow DOM for the first time
			this.visualizer = document.createElement('div');
			this.visualizer.style.position = 'absolute';
			this.visualizer.style.top = '0';
			this.visualizer.style.left = '0';
			this.visualizer.style.width = '100%';
			this.visualizer.style.height = '100%';
			this.visualizer.style.pointerEvents = 'none';
			this.visualizer.style.zIndex = '9999'; // Ensure it's on top of the page content

			// Attach the shadow DOM
			this.shadowRoot = this.visualizer.attachShadow({ mode: 'open' });

			// Inject a stylesheet into the shadow DOM
			const style = document.createElement('link');
			style.rel = 'stylesheet';
			style.href = browser.runtime.getURL('content/link-resolver.css');
			this.shadowRoot.appendChild(style); // Add the stylesheet to the shadow DOM
			this.linksRoot = document.createElement('div');
			this.shadowRoot.appendChild(this.linksRoot);

			// Append the visualizer to the body
			document.body.appendChild(this.visualizer);
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
	init() {
		this.observeLinkVisibility(group => this.handleGroupVisibility(group));
	}

	// Destroy the LinkResolver
	destroy() {
		// Stop observing all links in the IntersectionObserver
		if (this.observer) {
			this.groupedLinks.forEach(group => {
				group.elements.forEach(link => {
					this.observer.unobserve(link);
				});
			});
			this.observer.disconnect(); // Disconnect observer
		}

		// Stop observing movements of links
		if (this.movementObserver) {
			this.groupedLinks.forEach(group => {
				group.elements.forEach(link => {
					this.movementObserver.unobserve(link);
				});
			});
			this.movementObserver.disconnect();
		}

		// Remove all visual elements from the DOM
		if (this.linksRoot) {
			this.linksRoot.innerHTML = ''; // Clear all visual link elements
		}

		// Clear maps
		this.linkRectsMap.clear();
		this.linkGroupMap.clear();
		this.groupedLinks = [];

		// Remove the visualizer
		if (this.visualizer && this.visualizer.parentNode) {
			this.visualizer.parentNode.removeChild(this.visualizer);
		}

		// Clear internal states
		this.observer = null;
		this.movementObserver = null;
		this.visualizer = null;
		this.linksRoot = null;
		this.linkRectsMap = null;
		this.linkGroupMap = null;
	}
}

let linkResolver = null;

browser.runtime.onMessage.addListener((data, sender) => {
	if (data.type === 'highlight_links') {
		if (!linkResolver) {
			linkResolver = new LinkResolver({
				restrictors: data?.restrictors,
			});
			linkResolver.init(); // Initialize the LinkResolver
		}
		return Promise.resolve('done');
	}

	if (data.type === 'unhighlight_links') {
		if (linkResolver) {
			linkResolver.destroy(); // Destroy the LinkResolver
			linkResolver = null; // Reset the reference
		}
		return Promise.resolve('done');
	}

	return false;
});
