import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';
import NavigationManager from './NavigationManager.mjs';

class WikiBaseEntityManager {
	constructor(params) {
		this.wikibases = wikibases;
		this.entities = [];
		this.designators = [];
		this.languages = params.languages;
		this.queryManager = new WikiBaseQueryManager();

		for (const wikibase in this.wikibases) {
			// @todo add babel languages from instance
			this.wikibases[wikibase].languages = this.languages;
		}
	}
	async add(id) {
		if (this.entities?.[id]) {
			return this.entities[id];
		}
		const [wikibase, entity] = id.split(':');
		const url = this.wikibases[wikibase].api.getEntities({
			ids: [entity],
			language: this.languages,
		});

		const result = await fetch(url).then(res => res.json());

		const entityWithContext = this.entityAddContext({
			entity: result.entities[entity],
			wikibase: wikibase,
		});

		this.entities[id] = entityWithContext;

		return this.entities[id];
	}
	entityAddContext({ entity, wikibase }) {
		entity.wikibase = wikibase;
		const iterate = (item, prefix) => {
			if (Array.isArray(item)) {
				// If the item is an array, iterate over its elements
				item.forEach(element => iterate(element, prefix));
			} else if (typeof item === 'object' && item !== null) {
				// If the item is an object, iterate over its properties
				for (const key in item) {
					if (Object.hasOwnProperty.call(item, key)) {
						if (key === 'id') {
							item.id = `${wikibase}:${item[key]}`;
						} else if (key === 'property') {
							item.property = `${wikibase}:${item[key]}`;
						} else {
							// Otherwise, recursively call the function for nested objects/arrays
							iterate(item[key], prefix);
						}
					}
				}
			}
		};
		iterate(entity);
		return entity;
	}
	async fetchDesignators(id) {
		const [wikibase, entity] = id.split(':');
		const url = this.wikibases[wikibase].api.getEntities({
			ids: [entity],
			props: ['labels', 'descriptions'],
			language: this.languages,
		});

		const result = await fetch(url).then(res => res.json());

		this.designators[id] = result.entities[entity];

		return this.designators[id];
	}
	async query(wikibase, queryId, params) {
		const queryObject = this.queryManager.queries[queryId];
		const instance = this.wikibases[wikibase];
		const cached = this.queryManager.queryCached(instance, queryObject, params);
		if (cached) {
			return cached;
		}

		return await this.queryManager.query(instance, queryObject, params);
	}
}

export default WikiBaseEntityManager;
