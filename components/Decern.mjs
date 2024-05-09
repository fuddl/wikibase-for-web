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

	useEffect(() => {
		async function fetchLanguages() {
			const url = new URL(manager.wikibase.api.instance.apiEndpoint);
			url.search = new URLSearchParams({
				action: 'query',
				meta: 'wbcontentlanguages',
				uselang: manager.languages[0].replace(/-.+/, ''),
				wbclcontext: context,
				wbclprop: 'code|name',
				format: 'json',
			});

			try {
				const response = await fetch(url);
				const data = await response.json();
				const languagesData = data.query.wbcontentlanguages;

				const newLanguages = Object.keys(languagesData).map(
					key => languagesData[key].code,
				);

				const newLanguageNames = Object.keys(languagesData).reduce(
					(acc, key) => {
						acc[languagesData[key].code] = languagesData[key].name;
						return acc;
					},
					{},
				);

				const sortedNewLanguages =
					optionsHistoryAPI.getSortedOptions(newLanguages);

				setLanguages(sortedNewLanguages);
				setLanguageNames(newLanguageNames);
				setIsLoading(false);
			} catch (error) {
				console.error('Failed to fetch languages:', error);
				setIsLoading(false);
			}
		}

		fetchLanguages();
	}, [context]);

	return html`
		<div class="decern">
			${isLoading
				? html` <${Type}
						value=${value}
						type="text"
						value=${value}
						name="${name}"
						onValueChange=${handleChange} />`
				: html`
						<select
							class="decern__select"
							name=${name}
							onChange=${handleChange}>
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
