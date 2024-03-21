import { resolvers } from '../resolvers/index.mjs';
import { extractUrls } from '../modules/extractUrls.mjs';

async function ldToEdits({ ld, wikibase, lang = '', edits = [] }) {
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
			if (equivalentClasses.length === 1) {
				const targetValue = wikibase?.items[item.options[tag.content]];
				newEdits.push({
					action: 'wbcreateclaim',
					property: `${wikibase.id}:${wikibase.props.instanceOf}`,
					snaktype: 'value',
					datatype: 'wikibase-item',
					datavalue: {
						value: {
							id: `${wikibase.id}:${equivalentClasses[0]}`,
						},
					},
				});
			} else if (equivalentClasses.length > 1) {
				newEdits.push({
					action: 'wbcreateclaim',
					property: `${wikibase.id}:${wikibase.props.instanceOf}`,
					snaktype: 'value',
					datatype: 'wikibase-item',
					valueOptions: equivalentClasses.map(
						option => `${wikibase.id}:${option}`,
					),
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
				// is it a valid ISO date
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
						action: 'wbcreateclaim',
						property:
							timeProperties.length === 1
								? `${wikibase.id}:${timeProperties[0].prop}`
								: null,
						propertyOptions:
							timeProperties.length > 1
								? timeProperties.map(
										property => `${wikibase.id}:${property.prop}`,
									)
								: null,
						snaktype: 'value',
						datatype: 'time',
						datavalue: {
							type: 'time',
							value: {
								after: 0,
								before: 0,
								calendarmodel: 'wikidata:Q1985727',
								precision: precision,
								time: date,
								timezone: 0,
							},
						},
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
				const urls = extractUrls(value);
				if (urls) {
					const resolveAll = urls =>
						Promise.all(
							urls.map(async url => await resolvers.resolve(url, wikibase.id)),
						);
					let resolved = await resolveAll(urls);
					let items = resolved
						.flat()
						.map(item => item.resolved)
						.flat();

					const specificities = items.map(item => parseInt(item.specificity));
					const maxSpecific = Math.max(...specificities);

					items = items
						.filter(item => item.specificity === maxSpecific)
						.map(item => item.id)
						// filter only items. we could filter this in the query, can't we?
						.filter(id => id.startsWith(`${wikibase.id}:Q`));

					if (items.length > 0) {
						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${wikibase.props.instanceOf}`,
							snaktype: 'value',
							datatype: 'wikibase-item',
							valueOptions: items.length > 1 ? items : null,
							datavalue:
								items.length === 1
									? {
											value: {
												id: items[0],
											},
										}
									: null,
							property:
								wikibaseItemProperties.length === 1
									? `${wikibase.id}:${wikibaseItemProperties[0].prop}`
									: null,
							propertyOptions:
								wikibaseItemProperties.length > 1
									? wikibaseItemProperties.map(
											property => `${wikibase.id}:${property.prop}`,
										)
									: null,
						});
					}
				}
			}

			const monolingualtextProperties = equivalentProperties.filter(
				p => p.type === 'Monolingualtext',
			);
			if (monolingualtextProperties.length > 0) {
				newEdits.push({
					action: 'wbcreateclaim',
					property: `${wikibase.id}:${wikibase.props.instanceOf}`,
					snaktype: 'value',
					datatype: 'monolingualtext',
					datavalue: { value: { text: value, language: lang } },
					property:
						monolingualtextProperties.length === 1
							? `${wikibase.id}:${monolingualtextProperties[0].prop}`
							: null,
					propertyOptions:
						monolingualtextProperties.length > 1
							? monolingualtextProperties.map(
									property => `${wikibase.id}:${property.prop}`,
								)
							: null,
				});
			}
		}
	}

	return [...edits, ...newEdits];
}
export { ldToEdits };
