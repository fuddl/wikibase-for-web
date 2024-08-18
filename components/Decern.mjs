import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import Type from './Type.mjs';
import OptionsHistoryAPI from '../modules/OptionsHistoryAPI.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';
const optionsHistoryAPI = new OptionsHistoryAPI();

const html = htm.bind(h);

function Decern({ name, value, onValueChange, context, manager }) {
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

	return html`
		<div class="decern">
			${isLoading
				? html`<${Type}
						value=${value}
						type="text"
						value=${value}
						name="${name}"
						required
						onValueChange=${handleChange} />`
				: html`
						<select
							class="decern__select"
							name=${name}
							required
							onChange=${handleChange}>
							${!value &&
							html`<option disabled value="" selected>
								${browser.i18n.getMessage('no_language_selected')}
							</option>`}
							${languages.map(
								code => html`
									<option value=${code} selected=${code === value}>
										${languageNames[code] ?? code}
									</option>
								`,
							)}
						</select>
					`}
		</div>
	`;
}

export default Decern;
