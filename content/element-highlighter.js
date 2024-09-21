class ElementHighlighter {
	constructor() {
		this.currentEdits = [];
		this.observer = null;
		this.shadowRoot = null; // To store the shadow DOM
		this.elementsRoot = null;
		this.elementRectsMap = new Map(); // To track elements and their visual representation
		this.movementObserver = null; // Mutation observer for elements
		this.elementDataMap = new Map(); // To map elements to their data
		this.observedTargets = new Map(); // Map observed targets back to original elements
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

		// Regular expression to match dates in YYYY-MM-DD format
		this.dateRegex = /\s*\b\d{4}(-\d{2}(-\d{2}\b)?)?\s*/;

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
				bySelector: {
					selector: 'time[datetime]:not([datetime^="P"])',
					onVisualClick: async element => {
						const datetime = element.getAttribute('datetime');
						await browser.runtime.sendMessage({
							type: 'time_selected',
							datetime: datetime,
							source: createUrlReference(element),
						});
					},
				},
				byInnerText: {
					selector: this.findDateNodes.bind(this),
					onVisualClick: async element => {
						const datetime = element.textContent.match(this.dateRegex)[0];
						await browser.runtime.sendMessage({
							type: 'time_selected',
							datetime: datetime,
							source: createUrlReference(element),
						});
					},
				},
			},
			quantity: {
				bySelector: {
					selector: 'time[datetime^="P"]',
					onVisualClick: async element => {
						const duration = element.getAttribute('datetime');
						await browser.runtime.sendMessage({
							type: 'quantity_selected',
							duration: duration,
						});
					},
				},
			},
			email: {
				bySelector: {
					selector: 'a[href^="mailto:"]',
					onVisualClick: async element => {
						const email = element.href.replace('mailto:', '');
						await browser.runtime.sendMessage({
							type: 'email_selected',
							email: email,
						});
					},
				},
			},
			url: {
				bySelector: {
					selector: 'a[href]',
					onVisualClick: async element => {
						await browser.runtime.sendMessage({
							type: 'url_selected',
							url: element.href,
						});
					},
				},
			},
			item: {
				bySelector: {
					selector: 'a[href]',
					onVisualClick: async element => {
						await browser.runtime.sendMessage({
							type: 'resolve_selected',
							candidates: element.resolved,
							source: createUrlReference(element),
						});
					},
				},
			},
			lexeme: {
				bySelector: {
					selector: 'a[href]',
					onVisualClick: async element => {
						await browser.runtime.sendMessage({
							type: 'resolve_selected',
							candidates: element.resolved,
							source: createUrlReference(element),
						});
					},
				},
			},
		};
	}

	setJobs(edits) {
		this.currentEdits = edits;
		if (this.isVisible()) {
			this.rebuildVisualizer();
		}
	}

	// Collect elements based on active modes
	collectElementsByMode() {
		const elementsMap = new Map(); // To store unique elements and their associated data

		this.modes.forEach(modeName => {
			const mode = this.modeSelectors[modeName];

			for (const methodName in mode) {
				const method = mode[methodName];
				let elements = [];

				const selector = method.selector;
				if (typeof selector === 'string') {
					// It's a CSS selector
					elements = Array.from(document.querySelectorAll(selector));
				} else if (typeof selector === 'function') {
					// It's a custom function
					elements = elements.concat(selector());
				}

				elements.forEach(element => {
					if (!elementsMap.has(element)) {
						elementsMap.set(element, []);
					}
					elementsMap.get(element).push({
						mode: modeName,
						method: methodName,
						onVisualClick: method.onVisualClick,
					});
				});
			}
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
						const target = entry.target;
						if (!target._hasTriggered) {
							target._hasTriggered = true; // Mark the element as triggered

							// Retrieve the original element from the observed target
							const element = this.observedTargets.get(target);
							if (element) {
								callback(element); // Execute the callback for the element
							}
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

				// Map observed target back to the original element
				this.observedTargets.set(target, element);
			}
		}
	}

	async handleElementVisibility(element, retryCount = 3, delay = 1000) {
		const dataList = this.elementsMap.get(element);
		if (!dataList) {
			// Element is no longer being tracked
			return;
		}

		const modes = dataList.map(data => data.mode);

		if (
			modes.includes('item') ||
			modes.includes('lexeme') ||
			modes.includes('sense') ||
			modes.includes('form') ||
			modes.includes('property')
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
						return this.modes.some(mode => {
							if (this.typePatternMap?.[mode]) {
								const pattern = this.typePatternMap[mode];
								return pattern.test(resolved.id);
							} else {
								return false;
							}
						});
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
			} else if (resolvedCandidates.length > 0) {
				// Associate resolved candidates with the element
				element.resolved = resolvedCandidates;
				// Rebuild the visualizer once done or if retries are exhausted
				this.rebuildVisualizer();
			} else {
				// No candidates found, remove the element from elementsMap
				this.elementsMap.delete(element);
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

		// Clear existing element data map
		this.elementDataMap.clear();

		// Set of elements that need visuals
		const elementsToVisualize = new Set();

		// Add a visual representation for each element
		for (const [element, dataList] of this.elementsMap.entries()) {
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

			// Map the element to its dataList
			this.elementDataMap.set(element, dataList);

			// Update or create the visual rectangles
			this.updateElementVisual(element);

			const modes = dataList.map(data => data.mode);

			// Add element to the set
			if (
				(modes.includes('item') ||
					modes.includes('lexeme') ||
					modes.includes('sense') ||
					modes.includes('form') ||
					modes.includes('property')) &&
				(!element?.resolved || element?.resolved?.length === 0)
			) {
				// Skip elements that have not been resolved yet
				continue;
			}

			elementsToVisualize.add(element);
		}

		// Remove visuals for elements that no longer need them
		for (const element of this.elementRectsMap.keys()) {
			if (!elementsToVisualize.has(element)) {
				this.removeElementVisuals(element);
				this.elementDataMap.delete(element);
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
		const dataList = this.elementDataMap.get(element);

		// If dataList is undefined, return early
		if (!dataList) {
			this.removeElementVisuals(element);
			return;
		}

		// If it's a link that needed resolution but has no resolved candidates, don't create visuals
		const modes = dataList.map(data => data.mode);

		if (
			(modes.includes('item') ||
				modes.includes('lexeme') ||
				modes.includes('sense') ||
				modes.includes('form') ||
				modes.includes('property')) &&
			(!element.resolved || element.resolved.length === 0)
		) {
			// Remove visuals and return
			this.removeElementVisuals(element);
			this.elementDataMap.delete(element);
			return;
		}

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

			dataList.forEach(data => {
				const mode = data.mode;
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
		const dataList = this.elementDataMap.get(element);
		if (!dataList) {
			// Element is no longer being tracked
			return;
		}

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

		// Handle click events based on dataList
		elementVisual.addEventListener('click', async () => {
			for (const data of dataList) {
				const onVisualClick = data.onVisualClick;
				if (typeof onVisualClick === 'function') {
					await onVisualClick(element);
				}
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

		this.elementsRoot.innerText = '';

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

		// Clean up maps and observers
		this.elementsMap.clear();
		this.elementDataMap.clear();
		this.elementRectsMap.clear();
		this.observedTargets.clear();
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.movementObserver) {
			this.movementObserver.disconnect();
			this.movementObserver = null;
		}
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
