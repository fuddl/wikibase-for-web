import { ExternalIdClaim } from '../types/Claim.mjs';
import ISBN from '../importmap/isbn3-es6/isbn.js';

/**
 * Format ID based on the format specified
 * 
 * @param {string} id - The ID to format
 * @param {string} format - The format to apply
 * @returns {string} The formatted ID
 */
function formatId(id, format) {
	switch (format) {
		case 'upper':
			return id.toUpperCase();
		case 'lower':
		case 'insensitive':
			return id.toLowerCase();
		case 'bigint':
			return String(BigInt(id, 16));
		default:
			return id;
	}
}

/**
 * Process URL matches against patterns and create output
 * 
 * @param {string} location - The URL to match
 * @param {Array} patterns - The patterns to match against
 * @param {Object} wikibase - The wikibase instance
 * @param {number} specificityBase - Base specificity value for matches
 * @returns {Array} The matches found
 */
export async function processUrlPatterns(location, patterns, wikibase, specificityBase = 500) {
	if (!patterns || patterns.length === 0) {
		return [];
	}

	const href = decodeURIComponent(location);
	const output = [];

	for (const prop of patterns) {
		const match = href.match(prop.search);

		if (!match) {
			continue;
		}

		let id = href.replace(prop.search, prop.replace);

		// if the replace is faulty, and doesn't find anything
		// we cannot help it.
		if (!id) {
			continue;
		}

		// Apply formatting based on the format specified
		id = formatId(id, prop.format);

		// Handle special cases for ISBN
		if (prop.property === wikibase?.props?.isbn10 || 
			prop.property === wikibase?.props?.isbn13) {
			const hyphenated = ISBN.hyphenate(id);
			if (hyphenated) {
				id = hyphenated;
			}
		}

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
			specificity: specificityBase + prop.search.toString().length,
			titleExtractPattern: prop.title,
		});
	}

	return output;
}

/**
 * Common resolver function for URL pattern matches
 * 
 * @param {Object} params - The match parameters
 * @param {Object} context - The resolver context
 * @returns {Array} The resolved entities
 */
export async function resolveUrlPattern(
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
}

export const urlMatchPattern = {
	id: 'urlMatchPattern',
	applies: async function (location, { wikibase, queryManager, metadata }) {
		// Get generic patterns (without domain qualifier)
		const patterns = await queryManager.query(
			wikibase,
			queryManager.queries.urlMatchPattern,
		);

		// Process patterns using shared utility
		return processUrlPatterns(location, patterns, wikibase, 500);
	},
	resolve: resolveUrlPattern,
};
