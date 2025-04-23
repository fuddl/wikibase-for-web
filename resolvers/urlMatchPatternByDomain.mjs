import { processUrlPatterns, resolveUrlPattern } from './urlMatchPattern.mjs';

export const urlMatchPatternByDomain = {
	id: 'urlMatchPatternByDomain',
	applies: async function (location, { wikibase, queryManager, metadata }) {
		// Skip this resolver if domainName property isn't defined
		if (!wikibase?.props?.domainName) {
			return [];
		}
		
		// Extract domain from URL
		let hostname;
		try {
			const url = new URL(location);
			hostname = url.hostname;
		} catch (e) {
			// Invalid URL format
			return [];
		}

		// Generate domain variants (subdomain.domain.com and domain.com)
		const domainParts = hostname.split('.');
		const domains = [];
		
		if (domainParts.length >= 2) {
			// Add domain.com
			domains.push(`${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`);
		}
		
		// Add full hostname (e.g., subdomain.domain.com)
		if (hostname !== domains[0]) {
			domains.push(hostname);
		}

		// Get patterns specific to these domains
		const patterns = await queryManager.query(
			wikibase,
			queryManager.queries.urlMatchPatternByDomain,
			{ domains }
		);

		// Process patterns using shared utility (with higher specificity base)
		return processUrlPatterns(location, patterns, wikibase, 550);
	},
	resolve: resolveUrlPattern,
}; 