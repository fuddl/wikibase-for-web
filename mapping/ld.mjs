import { resolvers } from '../resolvers/index.mjs';

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

			console.debug(equivalentProperties);

			const timeProperties = equivalentProperties.filter(
				p => p.type === 'Time',
			);

			if (timeProperties && typeof value === 'string') {
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
								? `${wikibase.id}:${targetProperty}`
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
		}
	}

	return [...edits, ...newEdits];
}
export { ldToEdits };
