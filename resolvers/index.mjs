import { siteLinks } from './siteLinks.mjs';
import { url } from './url.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { urlMatchPatternByDomain } from './urlMatchPatternByDomain.mjs';
import { wikibase } from './wikibase.mjs';
import { hash } from './hash.mjs';
import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';
import Logger from '../modules/Logger.mjs';

const queryManager = new WikiBaseQueryManager();

const resolvers = {
	list: [hash, siteLinks, url, urlMatchPatternByDomain, urlMatchPattern, wikibase],
};

class ResolverCache {
	constructor() {
		this.cacheByTabId = new Map(); // Store cache items by tab ID
		this.cacheByUrl = new Map(); // Store cache items by URL
		this.logger = new Logger('wikibase-for-web__cache');
	}

	/**
	 * Add a cache item for a specific tab ID and URL.
	 * If the URL exists in the cache, all tabs with the same URL are updated.
	 * @param {number} tabId - The tab ID.
	 * @param {string} url - The URL of the tab.
	 * @param {*} data - The result of the resolution process.
	 */
	add(tabId = null, url = null, data) {
		// Add or update the cache for the tab ID
		if (tabId) {
			this.cacheByTabId.set(tabId, data);
			this.logger.log(`Added tab ${tabId} to cache`, data);
		}
		if (url) {
			this.cacheByUrl.set(url, data);
			this.logger.log(`Added ${url} to cache`, data);
		}

		browser.tabs.query({ url: url }, tabs => {
			tabs.forEach(tab => {
				this.cacheByTabId.set(tab.id, data);
			});
		});
	}

	/**
	 * Retrieve the cached data for a tab ID or URL.
	 * @param {number|string} identifier - The tab ID or URL.
	 * @returns {*} - The cached result, or undefined if not found.
	 */
	request(identifier) {
		if (typeof identifier === 'number') {
			this.logger.log(`Fullfiled request of tab ${identifier}`);
			// Request by tab ID
			return this.cacheByTabId.get(identifier);
		} else if (typeof identifier === 'string') {
			this.logger.log(`Fullfiled request ${identifier}`);
			// Request by URL
			return this.cacheByUrl.get(identifier);
		}

		this.logger.log(`Could not fulfill request for ${identifier}`);
		return undefined;
	}

	/**
	 * Remove a cache item for a specific tab ID or URL.
	 * If the URL is removed, all associated tabs are cleared.
	 * @param {number|string} identifier - The tab ID or URL.
	 */
	remove(identifier) {
		if (typeof identifier === 'number') {
			// Remove by tab ID
			this._getUrlByTabId(identifier).then(url => {
				this.cacheByTabId.delete(identifier);
				if (url) {
					// Check if any tabs with this URL still exist
					browser.tabs.query({ url: url }, tabs => {
						if (tabs.length === 0) {
							this.cacheByUrl.delete(url);
						}
					});
				}
			});
		} else if (typeof identifier === 'string') {
			// Remove by URL and clear all associated tabs
			browser.tabs.query({ url: identifier }, tabs => {
				tabs.forEach(tab => this.cacheByTabId.delete(tab.id));
				this.logger.log(`Removed tab ${tabId} from cache`);
				this.cacheByUrl.delete(identifier);
			});
		}
	}

	/**
	 * Helper method to find the URL associated with a tab ID.
	 * @param {number} tabId - The tab ID.
	 * @returns {string|null} - The URL associated with the tab, or null if not found.
	 */
	_getUrlByTabId(tabId) {
		return new Promise(resolve => {
			browser.tabs.get(tabId, tab => {
				if (browser.runtime.lastError) {
					resolve(null); // Handle cases where the tab might not exist
				} else {
					resolve(tab.url);
				}
			});
		});
	}
}

const resolvedCache = new ResolverCache();

resolvers.resolve = async function (url, allowedWikibases = null) {
	if (resolvedCache.request(url)) {
		return resolvedCache.request(url);
	}

	let candidates = [];
	const uniqueCandidatesMap = new Map();
	
	await Promise.all(
		this.list.map(async resolver => {
			await Promise.all(
				Object.keys(wikibases).map(async name => {
					if (allowedWikibases && !allowedWikibases.includes(name)) {
						return;
					}
					if (wikibases[name]?.resolve === false) {
						return;
					}
					const context = {
						wikibase: wikibases[name],
						queryManager: queryManager,
						wikibaseID: name,
					};
					const applies = await resolver.applies(url, context);
					if (applies.length > 0) {
						for (const apply of applies) {
							apply.resolved = await resolver.resolve(apply, context);
							const uniqueKey = JSON.stringify({
								id: apply.id, 
								wikibaseID: context.wikibaseID,
								url: apply.url || url
							});
							
							if (!uniqueCandidatesMap.has(uniqueKey)) {
								uniqueCandidatesMap.set(uniqueKey, apply);
							}
						}
					}
				}),
			);
		}),
	);

	candidates = Array.from(uniqueCandidatesMap.values());

	candidates.sort((a, b) => b.specificity - a.specificity);

	resolvedCache.add(null, url, candidates);

	return candidates;
};

export { resolvers, resolvedCache };
