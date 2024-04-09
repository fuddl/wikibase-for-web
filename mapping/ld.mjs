import {
	ExternalIdClaim,
	GlobeCoordinateClaim,
	MonolingualTextClaim,
	QuantityClaim,
	TimeClaim,
	WikibaseItemClaim,
} from '../types/Claim.mjs';
import { resolvers } from '../resolvers/index.mjs';

export function extractUrls(input) {
	const isUrl = string => {
		try {
			new URL(string);
			return true;
		} catch (e) {
			return false;
		}
	};

	if (typeof input === 'string') {
		return isUrl(input) ? [input] : [];
	} else if (typeof input === 'object' && input !== null) {
		const urls = [];
		for (const key of Object.keys(input)) {
			const value = input[key];
			if (!['url', 'sameAs'].includes(key)) {
				continue;
			}
			if (typeof value === 'string' && isUrl(value)) {
				urls.push(value);
			}
		}
		return urls;
	}
	return [];
}

async function ldToEdits({ ld, wikibase, lang = '', references }) {
	const newEdits = [];

	for (const d of ld) {
		if (!d?.['@isSubjectOfPage']) {
			continue;
		}

		// try to map the type
		if (d?.['@type'] && wikibase?.props?.instanceOf) {
			const equivalentClasses = await wikibase.manager.query(
				wikibase.id,
				'equivalentClasses',
				{
					class: d['@type'],
				},
			);
			if (equivalentClasses.length > 0) {
				newEdits.push({
					action: 'claim:create',
					claim: new WikibaseItemClaim({
						property: `${wikibase.id}:${wikibase.props.instanceOf}`,
						value: equivalentClasses.map(option => `${wikibase.id}:${option}`),
						references: references,
					}),
				});
			}
		}

		if (!d?.['@context']) {
			continue;
		}

		// try to map properties
		for (const property of Object.keys(d)) {
			if (property.startsWith('@')) {
				continue;
			}

			const value = d[property];

			const propertyUrl = `${d['@context']}/${property}`;
			const equivalentProperties = await wikibase.manager.query(
				wikibase.id,
				'equivalentProperties',
				{
					property: propertyUrl,
				},
			);

			const timeProperties = equivalentProperties.filter(
				p => p.type === 'Time',
			);

			if (timeProperties.length > 0 && typeof value === 'string') {
				// is it a valid ISO date?
				if (
					value.match(
						/^[\+-]?(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):?(\d{2})?(:?(\d{2})(.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?)?)?$/,
					)
				) {
					const normal = value.match(/^[\+-]/) ? value : `+${value}`;
					const lengthToPrecision = {
						5: 9, // Year (+YYYY)
						8: 10, // Year and month (+YYYY-MM)
						11: 11, // Full date (+YYYY-MM-DD)
						14: 12, // hour (+YYYY-MM-DDTHH)
						17: 14, // minute (+YYYY-MM-DDTHH:MM)
						20: 15, // minute (+YYYY-MM-DDTHH:MM:SS)
					};
					const precision = lengthToPrecision[normal.length];
					const filled = value.split(/-|T|:/g);
					const date = `+${filled[0] || '0000'}-${filled[1] || '00'}-${filled[2] || '00'}T${filled[3] || '00'}:${filled[4] || '00'}:${filled[5] || '00'}Z`;

					newEdits.push({
						action: 'claim:create',
						claim: new TimeClaim({
							precision: precision,
							time: date,
							references: references,
						}),
					});
				}
			}
			const wikibaseItemProperties = equivalentProperties.filter(
				p => p.type === 'WikibaseItem',
			);

			if (
				wikibaseItemProperties.length > 0 &&
				(typeof value === 'string' || typeof value === 'object')
			) {
				for (let val of Array.isArray(value) ? value : [value]) {
					const urls = extractUrls(val);
					if (urls) {
						const resolveAll = urls =>
							Promise.all(
								urls.map(
									async url => await resolvers.resolve(url, wikibase.id),
								),
							);
						let resolved = await resolveAll(urls);
						let items = resolved
							.flat()
							.map(item => item.resolved)
							.flat();

						const specificities = items.map(item => parseInt(item.specificity));
						const maxSpecific = Math.max(...specificities);

						// if the result is too unspecific, don't propose a statement.
						if (maxSpecific === 0) {
							continue;
						}

						items = items
							.filter(item => item.specificity === maxSpecific)
							.map(item => item.id)
							// filter only items. we could filter this in the query, can't we?
							.filter(id => id.startsWith(`${wikibase.id}:Q`));

						if (items.length > 0) {
							newEdits.push({
								action: 'claim:create',
								claim: new WikibaseItemClaim({
									property: wikibaseItemProperties.map(
										property => `${wikibase.id}:${property.prop}`,
									),
									value: items,
									references: references,
								}),
							});
						}
					}
				}
			}

			const monolingualtextProperties = equivalentProperties.filter(
				p => p.type === 'Monolingualtext',
			);
			if (monolingualtextProperties.length > 0) {
				newEdits.push({
					action: 'claim:create',
					claim: new MonolingualTextClaim({
						property: monolingualtextProperties.map(
							property => `${wikibase.id}:${property.prop}`,
						),
						text: value,
						language: lang,
						references: references,
					}),
				});
			}
		}
	}

	return newEdits;
}
export { ldToEdits };
