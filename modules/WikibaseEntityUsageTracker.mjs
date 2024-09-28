export class WikibaseEntityUsageTracker {
	constructor(instanceId) {
		this.instanceId = instanceId;
		this.storageKey = `wikibase_${this.instanceId}_entity_usage`;
		this.typePatterns = {
			item: /Q\d+$/,
			lexeme: /L\d+$/,
			sense: /L\d+-S\d+$/,
			form: /L\d+-F\d+$/,
			property: /P\d+$/,
		};
		// Load existing entities from localStorage or initialize
		this.entities = this.loadEntities();
	}

	// Load entities from localStorage
	loadEntities() {
		const entities = localStorage.getItem(this.storageKey);
		return entities ? JSON.parse(entities) : {};
	}

	// Save entities to localStorage
	saveEntities() {
		localStorage.setItem(this.storageKey, JSON.stringify(this.entities));
	}

	// Add an entity or update its last used time
	add(entityId) {
		if (!this.entities[entityId]) {
			this.entities[entityId] = {};
		}
		this.entities[entityId].lastUsed = new Date().toISOString();
		this.saveEntities();
	}

	// Get a sorted list of entities of a specific type, by last used date
	getLatest(type) {
		if (!this.typePatterns[type]) {
			throw new Error(`Invalid entity type: ${type}`);
		}

		const pattern = this.typePatterns[type];
		const filteredEntities = Object.keys(this.entities)
			.filter(entityId => pattern.test(entityId))
			.map(entityId => ({
				id: entityId,
				lastUsed: this.entities[entityId].lastUsed,
			}))
			.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

		return filteredEntities;
	}
}
