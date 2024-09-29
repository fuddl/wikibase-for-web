import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Wait from './Wait.mjs';
import Thing from './Thing.mjs';
import Describe from './Describe.mjs';

const html = htm.bind(h);

function getFirstMatchingName(names, langCode = 'mul') {
	// Helper function to normalize language code (e.g., 'en-us' -> 'en')
	const normalizeLangCode = code => code.split('-')[0];

	// Try exact match first
	if (names[langCode]) {
		return names[langCode][0]; // Return the first string for the exact match
	}

	// Try normalized language (e.g., 'en-us' -> 'en')
	const normalizedLang = normalizeLangCode(langCode);
	if (names[normalizedLang]) {
		return names[normalizedLang][0];
	}

	// Fallback to 'mul' if it exists
	if (names['mul']) {
		return names['mul'][0];
	}

	// As a last fallback, return the first string from any other language
	const anyOtherLang = Object.keys(names)[0];
	return names[anyOtherLang][0];
}

function List({ type, id, manager }) {
	const [properties, setProperties] = useState(false);
	const [entity, setEntity] = useState({});
	const [searchEngine, setSearchEngine] = useState(false);

	useEffect(async () => {
		requireStylesheet(browser.runtime.getURL('/components/list.css'));

		const result = await manager.queryManager.query(
			manager.wikibase,
			manager.queryManager.queries.expectedIds,
			{
				subject: id.replace(/.+\:/, ''),
			},
		);

		const currentEntity = await manager.add(id, false);

		setEntity(currentEntity);

		const engines = await browser.search.get();
		const defaultSearchEngine = engines.find(
			engine => engine.isDefault === true,
		);

		setSearchEngine(defaultSearchEngine);

		setProperties(result);
	}, []);

	const handleMessage = async message => {
		if (message.type === 'update_entity') {
			if (id === message.entity) {
				const updatedEntity = await manager.add(message.entity, false);
				setEntity(updatedEntity);
			}
		}
	};

	useEffect(() => {
		browser.runtime.onMessage.addListener(handleMessage);
		return () => {
			browser.runtime.onMessage.removeListener(handleMessage);
		};
	}, []);

	let names = {};

	if ('labels' in entity) {
		// First, add values from labels
		Object.keys(entity.labels).forEach(key => {
			names[key] = [entity.labels[key].value]; // Start with the value from labels
		});

		// Now, add values from aliases, ensuring no duplicates
		Object.keys(entity.labels).forEach(key => {
			if (!names[key]) {
				names[key] = [];
			}
			if (key in entity.aliases) {
				entity.aliases[key].forEach(alias => {
					if (!names[key].includes(alias.value)) {
						// Check for duplicates
						names[key].push(alias.value);
					}
				});
			}
		});
	}

	const statisfaction = {};

	if (properties.length > 0) {
		properties.map(property => {
			statisfaction[property.prop] =
				property.prop.replace(/.+\:/, '') in entity.claims;
		});
	}

	return html` ${properties === false
			? html`<${Wait} status=${browser.i18n.getMessage('searching_ids')} />`
			: ''}
		${properties.length > 0
			? html`<div class="list">
					${properties
						.filter(property => property.search || property.url)
						.map(
							property =>
								html`<details
									class="list__item"
									open=${!statisfaction[property.prop]}>
									<summary class="list__item__title">
										<${Describe}
											id=${`${property.prop}`}
											source="labels"
											manager=${manager} />
										${' '} ${statisfaction[property.prop] ? '✅' : '❌'}
									</summary>
									<p>
										<${Describe} id=${`${property.prop}`} manager=${manager} />
									</p>
									<form class="list__item__form">
										<input
											class="list__item__type"
											type="search"
											list=${`${id}-names`}
											value=${getFirstMatchingName(
												names,
												property.searchLang,
											)} />
										${property.search &&
										html`<button
											class="list__item__search"
											onClick=${e => {
												e.preventDefault();
												const value = e.target.previousSibling.value;
												const searchUrl = property.search.replace(
													'$1',
													encodeURIComponent(value),
												);
												window
													.open(searchUrl, `${property.prop}_search`)
													.focus();
											}}>
											🔎
										</button>`}
										${searchEngine &&
										property.url &&
										html`<button
											class="list__item__search"
											onClick=${e => {
												e.preventDefault();
												const value =
													e.target.parentNode.querySelector(
														'[type="search"]',
													).value;
												browser.search.query({
													text: `"${value}" site:${property.url}`,
													disposition: 'NEW_TAB',
												});
											}}>
											${searchEngine.name}
										</button>`}
									</form>
								</details>`,
						)}
				</div> `
			: ''}
		<datalist id=${`${id}-names`}>
			${Object.entries(names).map(([lang, names]) =>
				names.map(
					(name, key) =>
						html`<option
							key=${`${lang}-${key}`}
							lang=${lang}
							value="${name}"></option>`,
				),
			)}
		</datalist>`;
}

export default List;
