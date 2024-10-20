class ElementHighlighter {
	constructor() {
		this.modes = [];

		this.dateRegex = /\s*\b\d{4}(-\d{2}(-\d{2}\b)?)?\s*/;
		this.quantityRegex =
			/^\s*\d{1,3}(?:[.,]\d{1,3})?\s*(cm|mm|m|km|mg|g|kg|ml|l|h|s|min|m²|km²|cm²|mm²)?\s*$/;

		this.initDom();

		this.typePatternMap = {
			item: /Q\d+$/,
			lexeme: /L\d+$/,
			sense: /L\d+-S\d+$/,
			form: /L\d+-F\d+$/,
			property: /P\d+$/,
		};

		this.modeSelectors = {
			time: {
				bySelector: {
					selector: 'time[datetime]:not([datetime^="P"])',
					onVisualClick: async highlight => {
						const datetime = highlight.element.getAttribute('datetime');
						await browser.runtime.sendMessage({
							type: 'time_selected',
							datetime: datetime,
							source: createUrlReference(highlight.element),
						});
					},
				},
				bySelectorSchemaOrg: {
					selector: '[content]:is([itemprop$="Date"], [itemprop^="date"])',
					onVisualClick: async highlight => {
						const datetime = highlight.element.getAttribute('content');
						await browser.runtime.sendMessage({
							type: 'time_selected',
							datetime: datetime,
							source: createUrlReference(highlight.element),
						});
					},
				},
				byInnerText: {
					selector: this.findDateNodes.bind(this),
					onVisualClick: async highlight => {
						const datetime = highlight.element.textContent.match(
							this.dateRegex,
						)[0];
						await browser.runtime.sendMessage({
							type: 'time_selected',
							datetime: datetime,
							source: createUrlReference(highlight.element),
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
							amount: duration,
							source: createUrlReference(highlight.element),
						});
					},
				},
				byInnerText: {
					selector: this.findQuantityNodes.bind(this),
					onVisualClick: async highlight => {
						const [amount, unitString] = highlight.element.textContent.match(
							this.quantityRegex,
						);
						const elementLanguage = this.getObservable(
							highlight.element,
						).closest('[lang]')?.lang;

						await browser.runtime.sendMessage({
							type: 'quantity_selected',
							amount: this.parseLocalizedFloat(amount, elementLanguage),
							unitString: unitString,
							source: createUrlReference(highlight.element),
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
					onVisualClick: async highlight => {
						await browser.runtime.sendMessage({
							type: 'resolve_selected',
							candidates: highlight.resolved,
							source: createUrlReference(highlight.element),
						});
					},
				},
			},
			lexeme: {
				bySelector: {
					selector: 'a[href]',
					onVisualClick: async highlight => {
						await browser.runtime.sendMessage({
							type: 'resolve_selected',
							candidates: highlight.resolved,
							source: createUrlReference(highlight.element),
						});
					},
				},
			},
			monolingualtext: {
				bySelector: {
					selector:
						'blockquote, h1, h2, h3, h4, h5, h5, strong, em, i, caption, tr > th:only-child, [itemprop="alternateName"], [itemprop="name"]',
					onVisualClick: async highlight => {
						await browser.runtime.sendMessage({
							type: 'text_selected',
							value: highlight.element.innerText,
							lang: highlight.element.closest('[lang]')?.lang ?? null,
							source: createUrlReference(highlight.element),
							selectEvent: 'click',
						});
					},
				},
			},
		};
	}

	findDateNodes(tester) {
		const elements = [];
		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: node => {
					if (tester.test(node.textContent)) {
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

	findQuantityNodes(teste) {
		const elements = [];
		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: node => {
					if (this.quantityRegex.test(node.textContent)) {
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

	parseLocalizedFloat(str, locale) {
		try {
			// Use the provided locale or fall back to the user's preferred language
			const validLocale = Intl.NumberFormat.supportedLocalesOf(locale).length
				? locale
				: navigator.language;

			// Check if the valid locale uses commas as decimal separators
			const usesCommaAsDecimal = (1.1)
				.toLocaleString(validLocale)
				.includes(',');

			// Replace the appropriate decimal separator based on the locale
			if (usesCommaAsDecimal) {
				str = str.replace(',', '.'); // Convert comma to dot for parsing
			} else {
				str = str.replace(/,/g, ''); // Remove thousand separators (commas)
			}
		} catch (e) {
			// In case of any error, fallback to user's language
			str = str.replace(',', '.');
		}

		// Use parseFloat to convert the modified string to a float
		return parseFloat(str);
	}

	initDom() {
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
		this.visualsRoot = document.createElement('div');
		this.shadowRoot.appendChild(this.visualsRoot);
	}
	init({ modes, blacklist }) {
		this.highlights = new Map();
		this.modes = modes;
		this.blacklist = blacklist ?? [];
		this.jobs = [];

		this.iObserver = new IntersectionObserver(
			this.checkForIntersection.bind(this),
			{
				rootMargin: '0px',
				threshold: 0.1,
			},
		);
		this.mObserver = new MovementObserver(this.checkForMovement.bind(this));

		let elements = [];
		for (const mode of modes) {
			if (!(mode in this.modeSelectors)) {
				console.warn(`Mode ${mode} not supported. Skipping.`);
				continue;
			}
			for (const methodName in this.modeSelectors[mode]) {
				const method = this.modeSelectors[mode][methodName];
				if (typeof method.selector === 'string') {
					elements = [
						...elements,
						...Array.from(document.querySelectorAll(method.selector)),
					];
				} else if (typeof method.selector === 'function') {
					elements = [...elements, ...method.selector()];
				}

				elements.forEach(element => {
					const observable = this.getObservable(element);

					// Check if the current element is contained within any of the already highlighted elements
					let isContained = false;
					for (const highlightedElement of this.highlights.values()) {
						if (highlightedElement.element.contains(element)) {
							isContained = true;
							break;
						}
					}

					// Skip if element is contained within an already highlighted element
					if (isContained) {
						return;
					}

					if (!this.highlights.has(observable)) {
						this.highlights.set(observable, {
							inView: false,
							actions: [],
							element: element,
							visual: this.createVisual(),
							hovered: false,
							resolveRequested: false,
							needsResolve: mode in this.typePatternMap,
							resolved: false,
						});
					}
					this.highlights.get(observable).actions.push({
						mode: mode,
						method: method,
						onVisualClick: method.onVisualClick,
					});

					this.iObserver.observe(observable);
					this.mObserver.observe(observable);
				});
			}
		}
	}
	getObservable(element) {
		return element.nodeType === Node.TEXT_NODE ? element.parentNode : element;
	}
	checkForIntersection(entries) {
		entries.forEach(entry => {
			let highlight = this.highlights.get(entry.target);

			if (highlight) {
				highlight.inView = entry.isIntersecting;
				this.updateView();
			}
		});
	}
	checkForMovement(entries) {
		this.updateView();
	}
	updateView() {
		if (!this.visualizer.parentNode) {
			document.body.appendChild(this.visualizer);
		}
		this.highlights.forEach((highlight, element) => {
			if (highlight.visual.parentNode !== this.visualsRoot) {
				this.visualsRoot.appendChild(highlight.visual);
			}

			if (
				highlight.inView &&
				highlight.needsResolve &&
				highlight.resolveRequested === false &&
				highlight.resolved === false
			) {
				this.resolve(highlight, element);
			}

			this.updateVisual(highlight, element);
		});
	}
	getRects(node) {
		let subject;
		if (node.nodeType === Node.TEXT_NODE) {
			subject = document.createRange();
			subject.selectNodeContents(node);
		} else {
			subject = node;
		}
		return subject.getClientRects();
	}
	createVisual() {
		const visual = document.createElement('span');
		visual.classList.add('element-visual');
		return visual;
	}
	updateVisual(highlight, element) {
		if (!highlight.inView) {
			return;
		}

		highlight.visual.classList.toggle(
			'element-visual--needs-resolve',
			highlight.needsResolve,
		);

		if (highlight.resolved) {
			highlight.visual.classList.toggle(
				'element-visual--resolved',
				highlight.resolved?.length > 0,
			);
		}

		highlight.visual.classList.toggle(
			'element-visual--active',
			highlight.active,
		);

		highlight.visual.classList.toggle(
			'element-visual--hovered',
			highlight.hovered,
		);
		const rects = this.getRects(highlight.element);
		if (rects.length !== highlight.visual.children.length) {
			// @todo: rater then delete all, children, delete only unessesary one's
			highlight.visual.innerHTML = '';

			for (let i = 0; i < rects.length; i++) {
				const fragment = document.createElement('button');
				fragment.classList.add('element-visual__fragment');
				highlight.visual.appendChild(fragment);
				fragment.addEventListener('mouseenter', () => {
					highlight.hovered = true;
					this.updateView();
				});
				fragment.addEventListener('mouseleave', () => {
					highlight.hovered = false;
					this.updateView();
				});
				fragment.addEventListener('click', () => {
					highlight.actions.forEach(action => {
						action.onVisualClick(highlight);
					});
				});
			}
		}
		for (let i = 0; i < rects.length; i++) {
			const rect = rects[i];

			highlight.visual.children[i].style.top = `${rect.top + window.scrollY}px`;
			highlight.visual.children[i].style.left =
				`${rect.left + window.scrollX}px`;
			highlight.visual.children[i].style.width = `${rect.width}px`;
			highlight.visual.children[i].style.height = `${rect.height}px`;
		}
	}
	filterCandidates(candidates) {
		const minSpecificity = candidates.reduce(
			(highest, item) => Math.max(highest, item.specificity),
			0,
		);

		// filter all unspecific candidates
		candidates = candidates.filter(item => item.specificity >= minSpecificity);

		// remove blacklisted ids
		candidates = candidates.map(candidate => {
			if (this.blacklist) {
				candidate.resolved = candidate.resolved.filter(
					item => !this.blacklist.includes(item.id),
				);
			}
			return candidate;
		});

		// remove ids of the wrong type
		candidates = candidates.map(candidate => {
			candidate.resolved = candidate.resolved.filter(item => {
				return this.modes.some(mode => {
					if (this.typePatternMap?.[mode]) {
						return this.typePatternMap[mode].test(item.id);
					} else {
						return false;
					}
				});
			});
			return candidate;
		});

		// remove candidates that have no resolves left or that were never resolved in the first place
		candidates = candidates.filter(candidate => candidate.resolved.length > 0);
		return candidates;
	}
	resolve(highlight, element, retry = 3) {
		const sending = browser.runtime.sendMessage({
			type: 'request_resolve',
			url: highlight.element.href,
		});

		highlight.resolveRequested = true;

		sending.then(
			candidates => {
				// I don't understand why candidates are sometimes unefined
				if (typeof candidates === 'undefined' && retry > 0) {
					setTimeout(() => {
						this.resolve(highlight, element, retry - 1);
					}, 500);
					return;
				}

				highlight.resolved = this.filterCandidates(candidates);

				if (candidates.length > 0) {
					this.updateView();
				} else {
					return [];
				}
			},
			e => {
				console.error(e);
			},
		);
	}
	clear() {
		this.highlights = new Map();
		this.jobs = [];
		this.visualsRoot.innerText = '';
	}
	setJobs(jobs) {
		this.jobs = jobs;
		this.highlights.forEach(highlight => {
			// Check if a job has a claim and the appropriate value
			highlight.active = this.jobs.some(job => {
				return (
					job.claim?.mainsnak?.datavalue?.value?.id ===
					highlight?.resolved?.[0]?.resolved?.[0].id
				);
			});
		});
		this.updateView();
	}
}

let elementHighlighter = new ElementHighlighter();

// elementHighlighter.init({
// 	modes: ['item'], // Array of modes to activate
// });

browser.runtime.onMessage.addListener((data, sender) => {
	if (data.type === 'highlight_elements') {
		elementHighlighter.init({
			blacklist: data?.blacklist,
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
