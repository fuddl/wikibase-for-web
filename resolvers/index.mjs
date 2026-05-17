import { domain } from './domain.mjs';
import { hash } from './hash.mjs';
import { siteLinks } from './siteLinks.mjs';
import { url } from './url.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { urlMatchPatternByDomain } from './urlMatchPatternByDomain.mjs';
import { wikibase } from './wikibase.mjs';
import { mediawikiCommonsFile } from './mediawiki-commons-file.mjs';
import { error429, error5xx } from './test.mjs';
import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';
import Logger from '../modules/Logger.mjs';

const queryManager = new WikiBaseQueryManager();

const resolvers = {
	list: [hash, siteLinks, url, urlMatchPatternByDomain, urlMatchPattern, wikibase, domain, mediawikiCommonsFile, error429, error5xx],
	abortController: null,
};

function uniqueFilter(item, index, self) {
	return index === self.findIndex(el => JSON.stringify(el) === JSON.stringify(item));
}

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
			this.logger.info(`Added tab ${tabId} to cache`, data);
		}
		if (url) {
			this.cacheByUrl.set(url, data);
			this.logger.info(`Added ${url} to cache`, data);
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
			this.logger.info(`Fullfiled request of tab ${identifier}`);
			// Request by tab ID
			return this.cacheByTabId.get(identifier);
		} else if (typeof identifier === 'string') {
			this.logger.info(`Fullfiled request ${identifier}`);
			// Request by URL
			return this.cacheByUrl.get(identifier);
		}

		this.logger.info(`Could not fulfill request for ${identifier}`);
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
				this.logger.info(`Removed tab ${tabId} from cache`);
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

	if (this.abortController) {
		this.abortController.abort();
	}

	const settings = await browser.storage.sync.get('disabledResolvers');
	const disabledResolvers = settings.disabledResolvers !== undefined
		? settings.disabledResolvers
		: ['error429', 'error5xx'];
	const activeResolvers = this.list.filter(r => !disabledResolvers.includes(r.id));

	this.abortController = new AbortController();
	const signal = this.abortController.signal;

	const wikibaseNames = Object.keys(wikibases).filter(name => {
		if (allowedWikibases && !allowedWikibases.includes(name)) return false;
		if (wikibases[name]?.resolve === false) return false;
		return true;
	});

	await browser.runtime.sendMessage({
		type: 'resolving_started',
		url,
		resolvers: activeResolvers.map(r => r.id),
		wikibases: wikibaseNames
	});

	let candidates = [];
	try {
		await Promise.all(
			activeResolvers.map(async resolver => {
				await Promise.all(
					wikibaseNames.map(async name => {
						if (signal.aborted) return;

						if (wikibases[name].disabledResolvers?.includes(resolver.id)) {
							await browser.runtime.sendMessage({
								type: 'resolving_progress',
								url,
								resolver: resolver.id,
								wikibase: name,
								applies: false,
							});
							return;
						}

						const context = {
							wikibase: wikibases[name],
							queryManager: queryManager,
							wikibaseID: name,
							signal: signal,
						};
						try {
							const applies = await resolver.applies(url, context);
							let results = [];
							if (applies.length > 0) {
								for (const apply of applies) {
									if (signal.aborted) return;
									apply.resolved = await resolver.resolve(apply, context);
									if (apply.resolved) {
										results = [...results, ...apply.resolved];
									}
								}
								candidates = [...candidates, ...applies];
							}

							await browser.runtime.sendMessage({
								type: 'resolving_progress',
								url,
								resolver: resolver.id,
								wikibase: name,
								status: 'finished',
								results: results,
								applies: applies.length > 0,
							});
						} catch (error) {
							console.error(`Error resolving ${resolver.id} for ${name}:`, error);
							await browser.runtime.sendMessage({
								type: 'resolving_progress',
								url,
								resolver: resolver.id,
								wikibase: name,
								status: 'error',
								error: error.message,
								errorCode: error.status,
							});
						}
					}),
				);
			}),
		);
	} catch (e) {
		if (e.name === 'AbortError') {
			return candidates.filter(uniqueFilter);
		}
		throw e;
	}

	candidates = candidates.filter(uniqueFilter);

	candidates.sort((a, b) => b.specificity - a.specificity);

	resolvedCache.add(null, url, candidates);

	return candidates;
};

export { resolvers, resolvedCache };
