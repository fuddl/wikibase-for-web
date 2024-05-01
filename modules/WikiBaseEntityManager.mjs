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

			this.wikibases[wikibase].manager = this;
		}
	}
	async add(id, useCache = true) {
		if (this.entities?.[id] && useCache) {
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
		if (entity.lexicalCategory) {
			entity.lexicalCategory = `${wikibase}:${entity.lexicalCategory}`;
		}
		if (entity.language) {
			entity.language = `${wikibase}:${entity.language}`;
		}
		if (entity?.grammaticalFeatures?.length > 0) {
			entity.grammaticalFeatures = entity.grammaticalFeatures.map(
				id => `${wikibase}:${id}`,
			);
		}

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
						} else if (key === 'unit' && item.unit !== '1') {
							item.unit = this.idFromEntityUrl(item[key]);
						} else if (key === 'calendarmodel') {
							item.calendarmodel = this.idFromEntityUrl(item[key]);
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
		if (id in this.designators) {
			return this.designators[id];
		}
		const [wikibase, entity] = id.split(':');
		const url = this.wikibases[wikibase].api.getEntities({
			ids: [entity],
			props: ['labels', 'descriptions'],
			language: this.languages,
		});

		const result = await fetch(url).then(res => res.json());

		this.designators[id] = result.entities[entity];

		return this.entityAddContext({
			entity: this.designators[id],
			wikibase: wikibase,
		});
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
	async fetchPropOrder(wikibase) {
		if (!('propOrder' in this.wikibases[wikibase])) {
			const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
			try {
				const response = await fetch(
					`${endPoint}?action=query&titles=MediaWiki:Wikibase-SortedProperties&prop=revisions&rvprop=content&format=json&origin=*`,
				);
				const data = await response.json();
				const pageId = Object.keys(data.query.pages)[0];
				const lastRevisionContent =
					data?.query?.pages?.[pageId]?.revisions?.[0]['*'];
				if (lastRevisionContent) {
					this.wikibases[wikibase].propOrder =
						lastRevisionContent.match(/(P\d+)/g);
				} else {
					return [];
				}
			} catch (e) {
				console.log(`Failed to load prop order from ${wikibase}`);
				console.log(e);
			}
		}
		return this.wikibases[wikibase].propOrder;
	}
	idFromEntityUrl(url) {
		const normalisedUrl = url.replace(/^http:/, 'https:');
		const instance = Object.keys(this.wikibases).find(name => {
			return normalisedUrl.startsWith(this.wikibases[name].instance);
		});
		const id = url.match(/\/entity\/(\w(?:\d+\w)?\d+)$/)[1];
		return `${instance}:${id}`;
	}

	urlFromId(id) {
		const [wikibase, localId] = id.split(':');
		return `${this.wikibases[wikibase].api.instance.root}/entity/${localId}`;
	}
	urlFromIdNonSecure(id) {
		return this.urlFromId(id).replace(/^https/, 'http');
	}

	iconFromId(id) {
		const [wikibase] = id.split(':');
		if (this?.wikibases?.[wikibase]?.icon) {
			return browser.runtime.getURL(this.wikibases[wikibase].icon);
		}
		return browser.runtime.getURL('/icons/wikibase.svg');
	}
	updateSidebarAction(id) {
		const [wikibase] = id.split(':');
		browser.sidebarAction.setTitle({
			title: this.wikibases[wikibase].name,
		});
		browser.sidebarAction.setIcon({
			path: this.iconFromId(id),
		});
	}
}

export default WikiBaseEntityManager;
