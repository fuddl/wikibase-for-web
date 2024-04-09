import { UrlClaim } from '../types/Claim.mjs';

export const url = {
	id: 'url',
	applies: async function (location, { wikibase, queryManager, metadata }) {
		if (!wikibase.sparqlEndpoint) {
			return [];
		}
		const urlProperties = await queryManager.query(
			wikibase,
			queryManager.queries.urlProperties,
		);

		if (urlProperties.length === 0) {
			return [];
		}

		const proposeEdits = [];

		proposeEdits.push({
			action: 'claim:create',
			claim: new UrlClaim({
				property: urlProperties.map(option => `${wikibase.id}:${option}`),
				value: location,
			}),
			status: 'required',
		});

		return [
			{
				specificity: location.length,
				instance: wikibase.id,
				proposeEdits: proposeEdits,
				matchProperties: urlProperties,
				matchFromUrl: location,
				directMatch: false,
			},
		];
	},
	urlFuzziness: {
		noIndexHtml: url => url.replace(/\/index\.html?$/, ''),
		trailingSlash: url => (url.endsWith('/') ? url : `${url}/`),
		noTrailingSlash: url => (!url.endsWith('/') ? url : url.replace(/\/$/, '')),
		secure: url =>
			url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url,
		noScecure: url =>
			url.startsWith('https://') ? url.replace(/^https:\/\//, 'http://') : url,
		noWww: url =>
			url.match(/https?:\/\/www\./)
				? url.replace(/^(http:\/\/)www\./, '$1')
				: url,
		domainOnlyTrailingSlash: url => {
			const u = new URL(url);
			return `${u.protocol}//${u.hostname}/`;
		},
		domainOnly: url => {
			const u = new URL(url);
			return `${u.protocol}//${u.hostname}`;
		},
	},
	resolve: async function ({ matchFromUrl }, { wikibase, queryManager }) {
		const fuzzyPermutation = binaryVariations(Object.keys(this.urlFuzziness));

		const hrefs = [];
		for (const fuzzy of fuzzyPermutation) {
			let variation = matchFromUrl;
			for (const fuzz of fuzzy) {
				variation = this.urlFuzziness[fuzz](variation);
			}
			if (variation && !hrefs.includes(variation)) {
				hrefs.push(variation);
			}
		}

		const results = await queryManager.query(
			wikibase,
			queryManager.queries.itemByUrl,
			{
				urls: hrefs,
			},
		);
		const found = [];
		results.forEach(obj => {
			// Non-properties get a specificity bonus
			const specificityBonus = obj.item.startsWith('P') ? 0 : 1;

			// Calculate specificity based on the URL length and the bonus
			let specificity = obj.url.length + specificityBonus;

			// If the found URL is too different from the searched url. The
			// result has a hight probability to be useless.
			if (matchFromUrl.length - obj.url.length > 3) {
				specificity = 0;
			}

			// Find if the item already exists in the result array
			const existingIndex = found.findIndex(item => item.item === obj.item);

			if (existingIndex > -1) {
				// If exists and current specificity is higher, update the specificity
				if (found[existingIndex].specificity < specificity) {
					found[existingIndex].specificity = specificity;
				}
			} else {
				// If doesn't exist, add to the result array
				found.push({
					id: `${wikibase.id}:${obj.item}`,
					specificity: specificity,
				});
			}
		});
		found.sort((a, b) => b.specificity - a.specificity);
		return found;
	},
};
