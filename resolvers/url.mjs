import { UrlClaim } from '../types/Claim.mjs';

export const url = {
	id: 'url',
	applies: async function (location, { wikibase, queryManager, metadata, signal }) {
		if (!wikibase.sparqlEndpoint) {
			return [];
		}
		const urlProperties = await queryManager.query(
			wikibase,
			queryManager.queries.urlProperties,
			{},
			signal
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
				proposeSummary: browser.i18n.getMessage('match_via_url', wikibase.name),
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
	},
	resolve: async function ({ matchFromUrl, matchProperties }, { wikibase, queryManager, signal }) {

		// including these urls will significantly slow down these queries
		// we would resolve them with the siteLinks resolver anyway
		const isPartOfUrls = [];
		if (wikibase.sites) {
			for (const [id, site] of Object.entries(wikibase.sites)) {
				isPartOfUrls.push(`${new URL(site.pagePath).origin}/`);
			}
		}

		const hrefs = new Set();
		hrefs.add(matchFromUrl);
		hrefs.add(this.urlFuzziness.trailingSlash(matchFromUrl));
		hrefs.add(this.urlFuzziness.noTrailingSlash(matchFromUrl));
		hrefs.add(this.urlFuzziness.secure(matchFromUrl));
		hrefs.add(this.urlFuzziness.noScecure(matchFromUrl));
		hrefs.add(this.urlFuzziness.noWww(matchFromUrl));
		hrefs.add(this.urlFuzziness.noIndexHtml(matchFromUrl));

		const filteredHrefs = Array.from(hrefs).filter(h => !isPartOfUrls.includes(h));

		const results = await queryManager.query(
			wikibase,
			queryManager.queries.itemByUrl,
			{
				urls: filteredHrefs,
				properties: matchProperties,
			},
			signal
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
