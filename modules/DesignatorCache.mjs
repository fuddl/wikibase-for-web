/**
 * DesignatorCache — long-term localStorage persistence for entity designators
 * (labels and descriptions) used by Thing and Thin components.
 *
 * Each entry is stored as:
 * {
 *   labels:       { [lang]: { language, value } },
 *   descriptions: { [lang]: { language, value } },
 *   cachedAt:     <Unix ms timestamp>
 * }
 *
 * A configurable maxSize evicts the oldest entries when the cache grows too large.
 */

const STORAGE_KEY = 'wikibase_designators';
const DEFAULT_MAX_SIZE = 2000;

export class DesignatorCache {
	constructor({ maxSize = DEFAULT_MAX_SIZE } = {}) {
		this.maxSize = maxSize;
		this._cache = null; // lazily loaded
	}

	// ---------------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------------

	/** Load from localStorage on first access. */
	_load() {
		if (this._cache !== null) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			this._cache = raw ? JSON.parse(raw) : {};
		} catch {
			this._cache = {};
		}
	}

	/** Persist the current in-memory cache to localStorage. */
	_save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
		} catch (e) {
			// localStorage may be full; evict aggressively and retry
			this._evict(Math.ceil(this.maxSize * 0.1));
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
			} catch {
				// give up silently
			}
		}
	}

	/**
	 * Remove the `n` oldest entries from the in-memory cache.
	 * Does NOT save to storage — callers must do that.
	 */
	_evict(n) {
		const entries = Object.entries(this._cache).sort(
			(a, b) => (a[1].cachedAt ?? 0) - (b[1].cachedAt ?? 0),
		);
		for (let i = 0; i < Math.min(n, entries.length); i++) {
			delete this._cache[entries[i][0]];
		}
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	/** Return the cached designator entry for `id`, or `undefined`. */
	get(id) {
		this._load();
		return this._cache[id];
	}

	/**
	 * Store a designator entry.
	 * `entity` is the raw Wikibase entity object (must have `.labels` and
	 * `.descriptions`). Only those two fields are persisted.
	 */
	set(id, entity) {
		this._load();

		this._cache[id] = {
			labels: entity.labels ?? {},
			descriptions: entity.descriptions ?? {},
			cachedAt: Date.now(),
		};

		// Evict oldest entries if we're over the limit
		const keys = Object.keys(this._cache);
		if (keys.length > this.maxSize) {
			this._evict(keys.length - this.maxSize);
		}

		this._save();
	}

	/** Remove an entry. */
	delete(id) {
		this._load();
		delete this._cache[id];
		this._save();
	}

	/**
	 * Return up to `n` entries sorted by `cachedAt` ascending (oldest first).
	 * Optionally filter to entries older than `olderThanMs` milliseconds.
	 *
	 * Returns an array of `{ id, cachedAt }` objects.
	 */
	getOldest(n, { olderThanMs = 0 } = {}) {
		this._load();
		const cutoff = Date.now() - olderThanMs;
		return Object.entries(this._cache)
			.filter(([, entry]) => (entry.cachedAt ?? 0) < cutoff)
			.sort((a, b) => (a[1].cachedAt ?? 0) - (b[1].cachedAt ?? 0))
			.slice(0, n)
			.map(([id, entry]) => ({ id, cachedAt: entry.cachedAt }));
	}

	/** Number of currently cached entries. */
	get size() {
		this._load();
		return Object.keys(this._cache).length;
	}
}
