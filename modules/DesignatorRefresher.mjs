/**
 * DesignatorRefresher — background idle refresher for cached designators.
 *
 * Strategy:
 *  - Tracks the last time fetchDesignators was called on the manager.
 *  - After IDLE_DELAY_MS of silence, begins refreshing the oldest-cached
 *    entries in small batches (BATCH_SIZE at a time), pausing BATCH_INTERVAL_MS
 *    between batches.
 *  - Skips entries younger than STALE_AFTER_MS (not due for refresh yet).
 *  - Calls notifyActivity() from the outside to reset the idle timer whenever
 *    the user triggers a real request.
 */

const IDLE_DELAY_MS = 30_000;      // wait 30 s of inactivity before refreshing
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 10;             // ids to refresh per pass
const BATCH_INTERVAL_MS = 2_000;   // pause between batches

export class DesignatorRefresher {
	constructor(manager) {
		this.manager = manager;
		this._lastActivity = Date.now();
		this._idleTimer = null;
		this._running = false;
	}

	// Call this whenever a user-triggered fetch happens so we back off.
	notifyActivity() {
		this._lastActivity = Date.now();
		// If a refresh pass is mid-flight, cancelling is not necessary — the pass
		// itself checks _lastActivity before each batch and stops if activity was
		// detected.
	}

	start() {
		if (this._running) return;
		this._running = true;
		this._scheduleIdleCheck();
	}

	stop() {
		this._running = false;
		if (this._idleTimer !== null) {
			clearTimeout(this._idleTimer);
			this._idleTimer = null;
		}
	}

	// ---------------------------------------------------------------------------
	// Internal
	// ---------------------------------------------------------------------------

	_scheduleIdleCheck() {
		if (!this._running) return;
		this._idleTimer = setTimeout(() => this._onIdle(), IDLE_DELAY_MS);
	}

	async _onIdle() {
		if (!this._running) return;

		// Double-check: did activity happen while we were waiting?
		if (Date.now() - this._lastActivity < IDLE_DELAY_MS) {
			this._scheduleIdleCheck();
			return;
		}

		const cache = this.manager.designatorCache;
		if (!cache) {
			this._scheduleIdleCheck();
			return;
		}

		// Work through stale entries in batches
		let batch;
		do {
			batch = cache.getOldest(BATCH_SIZE, { olderThanMs: STALE_AFTER_MS });
			if (batch.length === 0) break;

			// Abort if user became active mid-refresh
			if (Date.now() - this._lastActivity < IDLE_DELAY_MS) break;

			const ids = batch.map(e => e.id);
			try {
				await this.manager.refreshDesignators(ids);
			} catch {
				// Network errors are silently ignored — we'll retry next idle cycle
				break;
			}

			// Small pause between batches
			await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL_MS));
		} while (this._running && batch.length === BATCH_SIZE);

		// Schedule the next idle check
		this._scheduleIdleCheck();
	}
}
