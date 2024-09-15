class MovementObserver {
	constructor(callback) {
		this.callback = callback;
		this.observedElements = new Map(); // Store observed elements and their previous locations
		this.checkPosition = this.checkPosition.bind(this);
	}

	observe(element) {
		if (this.observedElements.has(element)) return; // If already observing, skip
		const rect = element.getBoundingClientRect();
		this.observedElements.set(element, rect);

		// Start tracking using `requestAnimationFrame`
		if (this.observedElements.size === 1) {
			this.startTracking();
		}
	}

	unobserve(element) {
		this.observedElements.delete(element);

		// If there are no elements left to track, stop the tracking
		if (this.observedElements.size === 0) {
			this.stopTracking();
		}
	}

	disconnect() {
		this.observedElements.clear();
		this.stopTracking();
	}

	startTracking() {
		this.tracking = true;
		this.checkPosition();
	}

	stopTracking() {
		this.tracking = false;
	}

	checkPosition() {
		if (!this.tracking) return;

		this.observedElements.forEach((prevRect, element) => {
			const currentRect = element.getBoundingClientRect();

			if (
				prevRect.top !== currentRect.top ||
				prevRect.left !== currentRect.left ||
				prevRect.width !== currentRect.width ||
				prevRect.height !== currentRect.height
			) {
				this.callback([{ target: element, prevRect, currentRect }]);
				this.observedElements.set(element, currentRect); // Update with new position
			}
		});

		// Use `requestAnimationFrame` for continuous checking
		requestAnimationFrame(this.checkPosition);
	}
}
