import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import Type from './Type.mjs';
import OptionsHistoryAPI from '../modules/OptionsHistoryAPI.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';
const optionsHistoryAPI = new OptionsHistoryAPI();

const html = htm.bind(h);

function Decern({
	name,
	value,
	onValueChange,
	context,
	manager,
	onFocus,
	onBlur,
}) {
	const [languages, setLanguages] = useState([]);
	const [languageNames, setLanguageNames] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const handleChange = e => {
		if (onValueChange) {
			onValueChange({
				name: e.target.name,
				value: e.target.value,
			});
		}
	};

	// Utility function to find the closest match for the value
	const getClosestLanguageValue = value => {
		// If exact match exists, return it
		if (languageNames[value]) {
			return value;
		}

		// Try to find the base language (e.g., 'de' from 'de-de')
		const baseValue = value.split('-')[0];
		if (languageNames[baseValue]) {
			return baseValue;
		}

		// If no match is found, return the original value
		return value;
	};

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/decern.css'));
	}, []);

	useEffect(async () => {
		const { languages: newLanguages, languageNames: newLanguageNames } =
			await manager.fetchLanguages(manager.wikibase.id, context);

		const sortedNewLanguages = optionsHistoryAPI.getSortedOptions(newLanguages);

		setLanguages(sortedNewLanguages);
		setLanguageNames(newLanguageNames);
		setIsLoading(false);
	}, [context]);

	const closestValue = getClosestLanguageValue(value);

	return html`
		<div class="decern">
			${isLoading
				? html`<${Type}
						value=${value}
						type="text"
						value=${value}
						name="${name}"
						onFocus=${onFocus}
						onBlur=${onBlur}
						required
						onValueChange=${handleChange} />`
				: html`
						<select
							class="decern__select"
							name=${name}
							required
							onFocus=${onFocus}
							onBlur=${onBlur}
							onChange=${handleChange}>
							${!value &&
							html`<option disabled value="" selected>
								${browser.i18n.getMessage('no_language_selected')}
							</option>`}

							<optgroup label=${browser.i18n.getMessage('preferred_languages')}>
								${manager.wikibase.languages.map(code => {
									if (languages.includes(code)) {
										return html`<option
											key=${code}
											value=${code}
											selected=${code === closestValue}>
											${languageNames[code] ?? code}
										</option>`;
									}
								})}
							</optgroup>
							<optgroup label=${browser.i18n.getMessage('other_languages')}>
								${languages.map(code => {
									if (!manager.wikibase.languages.includes(code)) {
										return html`
											<option
												key=${code}
												value=${code}
												selected=${code === closestValue}>
												${languageNames[code] ?? code}
											</option>
										`;
									}
								})}
							</optgroup>
						</select>
					`}
		</div>
	`;
}

export default Decern;
