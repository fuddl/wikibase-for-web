import { ExternalIdClaim } from '../types/Claim.mjs';

export const urlMatchPattern = {
	id: 'urlMatchPattern',
	applies: async function (location, { wikibase, queryManager, metadata }) {
		const patterns = await queryManager.query(
			wikibase,
			queryManager.queries.urlMatchPattern,
		);
		const href = decodeURIComponent(location);

		const output = [];

		for (const prop of patterns) {
			const match = href.match(prop.search);

			if (!match) {
				continue;
			}

			let id = href.replace(prop.search, prop.replace);
			switch (prop.format) {
				case 'upper':
					id = id.toUpperCase();
					break;
				case 'lower':
				case 'insensitive':
					id = id.toLowerCase();
					break;
				case 'bigint':
					id = String(BigInt(id, 16));
					break;
			}

			// @todo handle isbn numbers?

			const proposeEdits = [];

			proposeEdits.push({
				action: 'claim:create',
				claim: new ExternalIdClaim({
					property: `${wikibase.id}:${prop.property}`,
					value: id,
				}),
				status: 'required',
			});

			output.push({
				directMatch: false,
				instance: wikibase.id,
				proposeSummary: browser.i18n.getMessage(
					'match_via_external_id',
					wikibase.name,
				),
				matchFromUrl: location,
				matchProperty: prop.property,
				matchValue: id,
				proposeEdits: proposeEdits,
				specificity: prop.search.toString().length,
				titleExtractPattern: prop.title,
			});
		}

		return output;
	},
	resolve: async function (
		{ matchProperty, matchValue, specificity },
		{ wikibase, queryManager },
	) {
		const found = [];
		const results = await queryManager.query(
			wikibase,
			queryManager.queries.itemByExternalId,
			{
				property: matchProperty,
				id: matchValue,
			},
		);
		for (const entity of results) {
			found.push({
				id: `${wikibase.id}:${entity}`,
				specificity: specificity,
			});
		}
		return found;
	},
};
