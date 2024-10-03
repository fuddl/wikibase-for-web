import { siteLinks } from './siteLinks.mjs';
import { url } from './url.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { wikibase } from './wikibase.mjs';
import { hash } from './hash.mjs';
import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';
import Logger from '../modules/Logger.mjs';

const queryManager = new WikiBaseQueryManager();

const resolvers = {
	list: [hash, siteLinks, url, urlMatchPattern, wikibase],
};

class ResolverCache {
	constructor() {
		this.cacheByTabId = new Map(); // Store cache items by tab ID
		this.cacheByUrl = new Map(); // Store cache items by URL
		this.tabsByUrl = new Map(); // Keep track of tabs with the same URL
		this.logger = new Logger('wikibase-for-web__cache');
	}

	/**
	 * Add a cache item for a specific tab ID and URL.
	 * If the URL exists in the cache, all tabs with the same URL are updated.
	 * @param {number} tabId - The tab ID.
	 * @param {string} url - The URL of the tab.
	 * @param {*} data - The result of the resolution process.
	 */
	add(tabId, url, data) {
		// Add or update the cache for the tab ID
		if (tabId) {
			this.cacheByTabId.set(tabId, data);
			this.cacheByUrl.set(url, data);
			this.logger.log(`Added tab ${tabId} to cache`, data);
		}

		if (url) {
			// Maintain a list of tabs associated with the URL
			if (!this.tabsByUrl.has(url)) {
				this.tabsByUrl.set(url, new Set());
			}
			this.tabsByUrl.get(url).add(tabId);
			this.logger.log(`Added ${url} to cache`, data);
		}

		// Update all tabs with the same URL
		const tabs = this.tabsByUrl.get(url);
		if (tabs) {
			for (const id of tabs) {
				this.cacheByTabId.set(id, data);
			}
		}
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
			const url = this._getUrlByTabId(identifier);
			this.cacheByTabId.delete(identifier);
			if (url) {
				const tabs = this.tabsByUrl.get(url);
				tabs.delete(identifier);
				if (tabs.size === 0) {
					this.cacheByUrl.delete(url);
					this.tabsByUrl.delete(url);
					this.logger.log(`Removed ${url} from cache`);
				}
			}
		} else if (typeof identifier === 'string') {
			// Remove by URL
			const tabs = this.tabsByUrl.get(identifier);
			if (tabs) {
				for (const tabId of tabs) {
					this.cacheByTabId.delete(tabId);
					this.logger.log(`Removed tab ${tabId} from cache`);
				}
				this.tabsByUrl.delete(identifier);
				this.cacheByUrl.delete(identifier);
			}
		}
	}

	/**
	 * Helper method to find the URL associated with a tab ID.
	 * @param {number} tabId - The tab ID.
	 * @returns {string|null} - The URL associated with the tab, or null if not found.
	 */
	_getUrlByTabId(tabId) {
		for (const [url, tabs] of this.tabsByUrl) {
			if (tabs.has(tabId)) {
				return url;
			}
		}
		return null;
	}
}

const resolvedCache = new ResolverCache();

resolvers.resolve = async function (url, allowedWikibases = null) {
	if (resolvedCache.request(url)) {
		return resolvedCache.request(url);
	}

	let candidates = [];
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
						}
						candidates = [...candidates, ...applies];
					}
				}),
			);
		}),
	);

	candidates.sort((a, b) => b.specificity - a.specificity);

	resolvedCache.add(null, url, candidates);

	return candidates;
};

export { resolvers, resolvedCache };
