import {
	ExternalIdClaim,
	GlobeCoordinateClaim,
	MonolingualTextClaim,
	QuantityClaim,
	StringClaim,
	TimeClaim,
	WikibaseItemClaim,
} from '../types/Claim.mjs';
import { resolvers } from '../resolvers/index.mjs';

function isNumberOrNumericString(value) {
	// Check if the type of value is 'number' and it is not NaN
	if (typeof value === 'number' && !isNaN(value)) {
		return true;
	}

	// Check if it's a string and contains only numeric characters (and possibly one decimal point)
	if (typeof value === 'string' && value.trim() !== '') {
		return /^-?\d*\.?\d+$/.test(value);
	}

	return false;
}

function findSubjectOfPage(obj) {
	if (obj && typeof obj === 'object') {
		// Check if the current object has the property set to true
		if (obj['@isSubjectOfPage'] === true) {
			return obj;
		}

		// Recursively search in each property of the object
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const result = findSubjectOfPage(obj[key]);
				if (result) {
					return result;
				}
			}
		}
	}

	// Return null if no matching object is found
	return null;
}

function durationToQuantity(data, wikibase) {
	let h, m, s;
	const hMatch = data.match(/(\d+)H/);
	if (hMatch) {
		h = parseInt(hMatch[1]);
	}
	const mMatch = data.match(/(\d+)M/);
	if (mMatch) {
		m = parseInt(mMatch[1]);
	}
	const sMatch = data.match(/(\d+)S/);
	if (sMatch) {
		s = parseInt(sMatch[1]);
	}
	if (s && 'second' in wikibase.items) {
		if (m) {
			s = s + m * 60;
		}
		if (h) {
			s = s + h * 3600;
		}
		return {
			amount: s,
			unit: `${wikibase.id}:${wikibase.items.second}`,
		};
	} else if (m && 'minute' in wikibase.items) {
		if (h) {
			m = m + h * 60;
		}
		return {
			amount: m,
			unit: `${wikibase.id}:${wikibase.items.minute}`,
		};
	} else if (h && 'hour' in wikibase.items) {
		return {
			amount: h,
			unit: `${wikibase.id}:${wikibase.items.hour}`,
		};
	}
	return false;
}

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

async function ldToEdits({
	ld,
	wikibase,
	metadata,
	references,
	newEdits = [],
}) {
	const makeSignature = tag => {
		return ['ld', new URL(metadata.location).hostname, `[${tag}]`].join(':');
	};

	for (const d of ld) {
		if (!d?.['@isSubjectOfPage']) {
			const graph = d?.['@graph'];
			const subjectOfPage = findSubjectOfPage(d);

			if (graph || subjectOfPage) {
				await ldToEdits({
					ld: graph ?? [subjectOfPage],
					wikibase: wikibase,
					metadata: metadata,
					references: references,
					newEdits: newEdits,
				});
			}
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
					signature: makeSignature('ld:type'),
					claim: new WikibaseItemClaim({
						property: `${wikibase.id}:${wikibase.props.instanceOf}`,
						value: equivalentClasses.map(option => `${wikibase.id}:${option}`),
						references: references,
					}),
				});
			}
		}

		if (!d?.['@context'] && !d?.['@type']) {
			continue;
		}

		// try to map properties
		for (const property of Object.keys(d)) {
			if (property.startsWith('@')) {
				continue;
			}

			const value = d[property];

			if (
				property === 'aggregateRating' &&
				wikibase.props.reviewScore &&
				isNumberOrNumericString(value?.bestRating) &&
				isNumberOrNumericString(value?.ratingValue)
			) {
				const best = value.bestRating ? parseFloat(value.bestRating) : 5;
				const rating = parseFloat(value.ratingValue);
				const ratingAction = {
					action: 'claim:create',
					signature: makeSignature('aggregateRating'),
					claim: new StringClaim({
						property: `${wikibase.id}:${wikibase.props.reviewScore}`,
						value: `${rating}/${best}`,
						references: references,
					}),
				};

				if (
					(value?.reviewCount || value?.ratingCount) &&
					wikibase.props.numberOfReviewsRatings &&
					wikibase.items.userReview
				) {
					ratingAction.claim.addQualifier(
						new QuantityClaim({
							property: `${wikibase.id}:${wikibase.props.numberOfReviewsRatings}`,
							amount: value?.reviewCount ?? value?.ratingCount,
							unit: `${wikibase.id}:${wikibase.items.userReview}`,
						}),
					);
				}
				if (wikibase?.props?.pointInTime) {
					let now = new Date();
					ratingAction.claim.addQualifier(
						new TimeClaim({
							property: `${wikibase.id}:${wikibase.props.pointInTime}`,
							time: `+${now.toISOString().substr(0, 10)}T00:00:00Z`,
							precision: 11,
						}),
					);
				}

				const reviewHosts = await wikibase.manager.query(
					wikibase.id,
					'reviewScoreHostnames',
					{
						hostname: new URL(metadata.location).hostname,
					},
				);

				if (reviewHosts.length > 0) {
					ratingAction.claim.addQualifier(
						new WikibaseItemClaim({
							property: `${wikibase.id}:${wikibase.props.reviewScoreBy}`,
							value: `${wikibase.id}:${reviewHosts[0]}`,
							references: references,
						}),
					);
				}

				newEdits.push(ratingAction);
				continue;
			}

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
						20: 15, // second (+YYYY-MM-DDTHH:MM:SS)
					};

					// Determine the base precision from the length (or 20 if not found)
					const basePrecision = lengthToPrecision[normal.length] ?? 20;

					// currently the maximum precision is 11
					const precision = Math.min(basePrecision, 11);

					const [
						year = '0000',
						month = '00',
						day = '00',
						hour = '00',
						minute = '00',
						secondWithFraction = '00',
					] = value.split(/-|T|:|Z|\+/g);

					const second = secondWithFraction.split('.')[0] || '00';

					const date = `+${year}-${month}-${day}T${/*hour*/ '00'}:${/*minute*/ '00'}:${/*second*/ '00'}Z`;

					newEdits.push({
						action: 'claim:create',
						signature: makeSignature(property),
						claim: new TimeClaim({
							property: timeProperties.map(
								property => `${wikibase.id}:${property.prop}`,
							),
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
								signature: makeSignature(property),
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
			if (monolingualtextProperties.length > 0 && typeof value === 'string') {
				newEdits.push({
					action: 'claim:create',
					signature: makeSignature(property),
					claim: new MonolingualTextClaim({
						property: monolingualtextProperties.map(
							property => `${wikibase.id}:${property.prop}`,
						),
						text: value,
						language: metadata?.lang ? metadata.lang.toLowerCase() : 'und',
						references: references,
					}),
				});
			}

			const quantityProperties = equivalentProperties.filter(
				p => p.type === 'Quantity',
			);
			if (quantityProperties.length > 0) {
				if (typeof value === 'string') {
					const parseValue = durationToQuantity(value, wikibase);

					if (parseValue) {
						newEdits.push({
							action: 'claim:create',
							signature: makeSignature(property),
							claim: new QuantityClaim({
								property: quantityProperties.map(
									property => `${wikibase.id}:${property.prop}`,
								),
								...parseValue,
								references: references,
							}),
						});
					}
				}
			}
		}
	}

	return newEdits;
}
export { ldToEdits };
