class ElementHighlighter {
	constructor() {
		this.currentEdits = [];
		this.observer = null;
		this.shadowRoot = null; // To store the shadow DOM
		this.elementsRoot = null;
		this.elementRectsMap = new Map(); // To track elements and their visual representation
		this.movementObserver = null; // Movement observer for elements
		this.elementGroupMap = new Map(); // To map elements to their modes
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
		style.href = browser.runtime.getURL('content/element-highlighter.css');
		this.shadowRoot.appendChild(style); // Add the stylesheet to the shadow DOM

		// Initialize the elementsRoot after attaching shadowRoot
		this.elementsRoot = document.createElement('div');
		this.shadowRoot.appendChild(this.elementsRoot);
		this.active = false;

		this.modes = []; // Active modes

		// Patterns for different modes
		this.typePatternMap = {
			item: /Q\d+$/,
			lexeme: /L\d+$/,
			sense: /L\d+-S\d+$/,
			form: /L\d+-F\d+$/,
			property: /P\d+$/,
		};

		// Selectors or functions for different modes
		this.modeSelectors = {
			time: {
				selector: 'time[datetime]:not([datetime^="P"])', // Exclude durations
				customMatcher: this.findDateNodes.bind(this), // Custom function to find date nodes
			},
			quantity: 'time[datetime^="P"]',
			url: 'a[href]',
			globeCoordinate: '[data-latitude][data-longitude], [lat][lon]',
			email: 'a[href^="mailto:"]',
			item: 'a[href]',
			lexeme: 'a[href]',
			sense: 'a[href]',
			form: 'a[href]',
			property: 'a[href]',
		};

		// Regular expression to match dates in YYYY-MM-DD format
		this.dateRegex = /\b\d{4}-\d{2}-\d{2}\b/;
	}

	setJobs(edits) {
		this.currentEdits = edits;
		if (this.isVisible()) {
			this.rebuildVisualizer();
		}
	}

	// Collect elements based on active modes
	collectElementsByMode() {
		const elementsMap = new Map(); // To store unique elements and corresponding modes

		this.modes.forEach(mode => {
			const modeConfig = this.modeSelectors[mode];
			let elements = [];

			if (typeof modeConfig === 'string') {
				// It's a CSS selector
				elements = Array.from(document.querySelectorAll(modeConfig));
			} else if (typeof modeConfig === 'object') {
				// It may have a selector and/or custom matcher
				if (modeConfig.selector) {
					elements = elements.concat(
						Array.from(document.querySelectorAll(modeConfig.selector)),
					);
				}
				if (modeConfig.customMatcher) {
					elements = elements.concat(modeConfig.customMatcher());
				}
			} else if (typeof modeConfig === 'function') {
				// It's a custom function
				elements = elements.concat(modeConfig());
			}

			elements.forEach(element => {
				if (!elementsMap.has(element)) {
					elementsMap.set(element, new Set());
				}
				elementsMap.get(element).add(mode);
			});
		});

		return elementsMap;
	}

	// Custom function to find date nodes not covered by CSS selectors
	findDateNodes() {
		const elements = [];
		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: node => {
					if (this.dateRegex.test(node.textContent)) {
						return NodeFilter.FILTER_ACCEPT;
					}
					return NodeFilter.FILTER_REJECT;
				},
			},
			false,
		);

		let node;
		while ((node = walker.nextNode())) {
			elements.push(node);
		}

		return elements;
	}

	// Observe elements and execute the callback when triggered
	observeElementVisibility(callback) {
		this.observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const element = entry.target;
						if (!element._hasTriggered) {
							element._hasTriggered = true; // Mark the element as triggered
							callback(element); // Execute the callback for the element
						}
					}
				});
			},
			{
				root: null, // Use the browser viewport as the container
				threshold: 0.1, // Trigger when at least 10% of the element is visible
			},
		);

		// Observe each element
		for (const element of this.elementsMap.keys()) {
			// For text nodes, observe their parent element
			const target =
				element.nodeType === Node.TEXT_NODE ? element.parentNode : element;
			if (target) {
				target._hasTriggered = false; // Track whether the element has been triggered
				this.observer.observe(target); // Start observing each element
			}
		}
	}

	async handleElementVisibility(element, retryCount = 3, delay = 1000) {
		const modes = this.elementsMap.get(element);

		if (
			modes.has('item') ||
			modes.has('lexeme') ||
			modes.has('sense') ||
			modes.has('form') ||
			modes.has('property')
		) {
			// Handle as link that needs to be resolved
			const url = element.href;
			const candidates = await browser.runtime.sendMessage({
				type: 'request_resolve',
				url: url,
			});

			let resolvedCandidates = [];
			if (candidates && candidates.length > 0) {
				const firstCandidate = candidates[0];
				resolvedCandidates =
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
			if (resolvedCandidates.length === 0 && retryCount > 0) {
				if (this.active) {
					setTimeout(() => {
						this.handleElementVisibility(element, retryCount - 1, delay);
					}, delay);
				}
			} else {
				// Associate resolved candidates with the element
				element.resolved = resolvedCandidates;
				// Rebuild the visualizer once done or if retries are exhausted
				this.rebuildVisualizer();
			}
		} else {
			// For other modes, we can immediately rebuild the visualizer
			this.rebuildVisualizer();
		}
	}

	isVisible() {
		return this.visualizer.parentElement;
	}

	// Rebuild the element visualizer
	rebuildVisualizer() {
		// Check if the visualizer exists, if not, create and initialize it
		if (!this.isVisible()) {
			// Append the visualizer to the body
			document.body.appendChild(this.visualizer);
		}

		// Create a movement observer to track changes to element size/position
		if (!this.movementObserver) {
			this.movementObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type === 'characterData') {
						this.updateElementVisual(mutation.target);
					}
				});
			});
		}

		// Set of elements that need visuals
		const elementsToVisualize = new Set();

		// Add a visual representation for each element
		for (const [element, modes] of this.elementsMap.entries()) {
			// For text nodes, observe their parent element
			const target =
				element.nodeType === Node.TEXT_NODE ? element.parentNode : element;

			// Track the element for mutations
			if (target && this.movementObserver) {
				this.movementObserver.observe(target, {
					childList: true,
					subtree: true,
					characterData: true,
				});
			}

			// Map the element to its modes
			this.elementGroupMap.set(element, modes);

			// Update or create the visual rectangles
			this.updateElementVisual(element);

			// Add element to the set
			if (
				modes.has('item') ||
				modes.has('lexeme') ||
				modes.has('sense') ||
				modes.has('form') ||
				modes.has('property')
			) {
				if (element?.resolved?.length > 0) {
					elementsToVisualize.add(element);
				}
			} else {
				elementsToVisualize.add(element);
			}
		}

		// Remove visuals for elements that no longer need them
		for (const element of this.elementRectsMap.keys()) {
			if (!elementsToVisualize.has(element)) {
				this.removeElementVisuals(element);
				this.elementGroupMap.delete(element);
			}
		}
	}

	// Update the visual representation of the element
	updateElementVisual(element) {
		// Get the existing visuals for the element, if any
		let visuals = this.elementRectsMap.get(element) || [];
		// Get all the client rectangles (to handle line breaks)

		let rects;
		if (element.nodeType === Node.TEXT_NODE) {
			rects = this.getTextNodeRects(element);
		} else {
			rects = element.getClientRects();
		}

		// If the number of rects is different from the number of visuals
		if (rects.length !== visuals.length) {
			// Remove existing visuals
			visuals.forEach(visual => {
				if (visual.parentNode) {
					visual.parentNode.removeChild(visual);
				}
			});
			visuals = [];

			// Create new visuals for each rect
			for (let i = 0; i < rects.length; i++) {
				const elementVisual = document.createElement('button');
				elementVisual.classList.add('element-visual');

				// Add event listeners
				this.addElementVisualEventListeners(elementVisual, element);

				// Append this visual element to the shadow DOM
				this.elementsRoot.appendChild(elementVisual);

				visuals.push(elementVisual);
			}
			// Update the map
			this.elementRectsMap.set(element, visuals);
		}
		const modes = this.elementGroupMap.get(element);

		// Now update the position and styles of the visuals
		for (let i = 0; i < rects.length; i++) {
			const rect = rects[i];
			const elementVisual = visuals[i];

			elementVisual.style.top = `${rect.top + window.scrollY}px`;
			elementVisual.style.left = `${rect.left + window.scrollX}px`;
			elementVisual.style.width = `${rect.width}px`;
			elementVisual.style.height = `${rect.height}px`;
		}

		// Update classes based on modes

		visuals.forEach(elementVisual => {
			elementVisual.className = 'element-visual'; // Reset classes

			modes.forEach(mode => {
				elementVisual.classList.add(`element-visual--mode_${mode}`);
			});

			if (this.isActiveElement(element)) {
				elementVisual.classList.add('element-visual--active');
			}
		});
	}

	// Helper function to get bounding rects of text nodes
	getTextNodeRects(textNode) {
		const range = document.createRange();
		range.selectNodeContents(textNode);
		return range.getClientRects();
	}

	// Determine if the element is active based on current edits
	isActiveElement(element) {
		if (!element.resolved || element.resolved.length === 0) return false;

		const resolvedId = element.resolved[0]?.resolved[0]?.id;

		// Check if the resolvedId exists in any of the job claims
		return this.currentEdits.some(job => {
			// Check if the job has a claim and the appropriate value
			return job.claim?.mainsnak?.datavalue?.value?.id === resolvedId;
		});
	}

	// Add event listeners to the element visual
	addElementVisualEventListeners(elementVisual, element) {
		const modes = this.elementGroupMap.get(element);

		// Add hover event to add class to all visuals of the same element
		elementVisual.addEventListener('mouseover', () => {
			const visuals = this.elementRectsMap.get(element);
			if (visuals) {
				visuals.forEach(visual =>
					visual.classList.add('element-visual--hovered'),
				);
			}
		});

		// Remove class when mouse leaves
		elementVisual.addEventListener('mouseleave', () => {
			const visuals = this.elementRectsMap.get(element);
			if (visuals) {
				visuals.forEach(visual =>
					visual.classList.remove('element-visual--hovered'),
				);
			}
		});

		// Handle click events based on modes
		elementVisual.addEventListener('click', async () => {
			if (modes.has('email')) {
				// Handle email click
				await browser.runtime.sendMessage({
					type: 'email_selected',
					email: element.href.replace('mailto:', ''),
				});
			} else if (modes.has('time')) {
				// Handle time click
				let datetime;
				if (element.nodeType === Node.TEXT_NODE) {
					datetime = element.textContent.match(this.dateRegex)[0];
				} else {
					datetime = element.getAttribute('datetime');
				}
				await browser.runtime.sendMessage({
					type: 'time_selected',
					datetime: datetime,
				});
			} else if (modes.has('quantity')) {
				// Handle quantity click
				await browser.runtime.sendMessage({
					type: 'quantity_selected',
					duration: element.getAttribute('datetime'),
				});
			} else if (modes.has('globecoordinate')) {
				// Handle globe coordinate click
				const latitude =
					element.dataset.latitude || element.getAttribute('lat');
				const longitude =
					element.dataset.longitude || element.getAttribute('lon');
				await browser.runtime.sendMessage({
					type: 'coordinate_selected',
					latitude,
					longitude,
				});
			} else if (modes.has('url')) {
				// Handle URL click
				await browser.runtime.sendMessage({
					type: 'url_selected',
					url: element.href,
				});
			} else if (
				modes.has('item') ||
				modes.has('lexeme') ||
				modes.has('sense') ||
				modes.has('form') ||
				modes.has('property')
			) {
				// Handle resolved link click
				await browser.runtime.sendMessage({
					type: 'resolve_selected',
					candidates: element.resolved,
					source: createUrlReference(element),
				});
			}
		});
	}

	// Remove the visual elements for an element when it's updated
	removeElementVisuals(element) {
		if (this.elementRectsMap.has(element)) {
			const visuals = this.elementRectsMap.get(element);
			visuals.forEach(visual => {
				if (visual.parentNode) {
					visual.parentNode.removeChild(visual);
				}
			});
			this.elementRectsMap.delete(element); // Remove from map
		}
	}

	// Initialize the observer and pass the callback for element visibility
	init({ restrictors, modes }) {
		this.restrictors = restrictors;
		this.modes = modes;

		this.elementsMap = this.collectElementsByMode();
		this.observeElementVisibility(element =>
			this.handleElementVisibility(element),
		);
		this.active = true;
	}

	// Destroy the ElementHighlighter
	clear() {
		this.visualizer.remove();
		this.active = false;
	}
}

let elementHighlighter = new ElementHighlighter();

browser.runtime.onMessage.addListener((data, sender) => {
	if (data.type === 'highlight_elements') {
		elementHighlighter.init({
			restrictors: data?.restrictors,
			modes: data?.modes, // Array of modes to activate
		});
		return Promise.resolve('done');
	}

	if (data.type === 'unhighlight_elements') {
		elementHighlighter.clear();
		return Promise.resolve('done');
	}

	if (data.type === 'highlight_jobs') {
		elementHighlighter.setJobs(data.edits);
		return Promise.resolve('done');
	}

	return false;
});
