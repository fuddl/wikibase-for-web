import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';
import { fetchJSON } from './fetch.mjs';
import NavigationManager from './NavigationManager.mjs';

class WikiBaseEntityManager {
	constructor(params) {
		this.wikibases = wikibases;
		this.entities = [];
		this.designators = [];
		this.datatypes = {};
		this.languages = params.languages;
		this.queryManager = new WikiBaseQueryManager();

		for (const wikibase in this.wikibases) {
			this.wikibases[wikibase].manager = this;
			this.wikibases[wikibase].languages = this.languages;

			this.fetchBabelLanguages(wikibase)
				.then(result => {
					this.wikibases[wikibase].languages = Array.from(
						new Set([...this.languages, ...result]),
					);
				})
				.catch(error => {
					console.error('Error fetching data:', error);
				});

			// make sure 'default for all languages' is selected as a fallback
			if (!this.wikibases[wikibase].languages.includes('mul')) {
				this.wikibases[wikibase].languages.push('mul');
			}

			this.fetchUIOptions(wikibase)
				.then(result => {
					this.wikibases[wikibase].UIOptions = result;
				})
				.catch(error => {
					console.error('Error fetching UI options:', error);
				});
		}
	}



	async getUsername(wikibase) {
		try {
			const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
			const url = new URL(endPoint);
			url.search = new URLSearchParams({
				action: 'query',
				meta: 'userinfo',
				uiprop: 'name',
				format: 'json',
			});

			const data = await fetchJSON(url.toString());
			if (data.error) {
				console.error(data.error);
				return null;
			}

			const userInfo = data.query.userinfo;
			if (!userInfo || !userInfo.name || userInfo?.id === 0) {
				return null;
			}

			return userInfo.name;
		} catch (error) {
			console.error('Failed to fetch username:', error);
			return null;
		}
	}

	async fetchBabelLanguages(wikibase) {
		try {
			const username = await this.getUsername(wikibase);
			if (!username) {
				return [];
			}

			const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
			const url = new URL(endPoint);
			url.search = new URLSearchParams({
				action: 'query',
				meta: 'babel',
				babuser: username,
				format: 'json',
			});

			const data = await fetchJSON(url.toString());
			if (data.error) {
				console.error(data.error);
				return [];
			}

			const babelInfo = data.query.babel;
			if (!babelInfo) {
				return [];
			}

			const babelLanguages = [];

			for (const [lang, proficiency] of Object.entries(babelInfo)) {
				// add `if (proficiency === 'N' || Number(proficiency) > 0)`
				// to include only language the user has at least some proficiency in
				babelLanguages.push(lang.toLowerCase());
			}

			return babelLanguages;
		} catch (error) {
			console.error('Failed to fetch Babel languages:', error);
			return [];
		}
	}

	async fetchUIOptions(wikibase) {
		try {
			const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
			const url = new URL(endPoint);
			url.search = new URLSearchParams({
				action: 'query',
				meta: 'userinfo',
				uiprop: 'options',
				format: 'json',
			});

			const data = await fetchJSON(url.toString());
			if (data.error) {
				console.error(data.error);
				return [];
			}

			return data?.query?.userinfo?.options;
		} catch (error) {
			console.error('Failed to fetch UI options:', error);
			return [];
		}
	}

	async resolveDatatypes(propertyIds) {
		const missingIds = [...new Set(propertyIds)].filter(
			id => !this.datatypes[id],
		);
		if (missingIds.length === 0) return;

		const byWikibase = {};
		for (const id of missingIds) {
			const [wikibase, localId] = id.split(':');
			if (!byWikibase[wikibase]) byWikibase[wikibase] = [];
			byWikibase[wikibase].push(localId);
		}

		await Promise.all(
			Object.entries(byWikibase).map(async ([wikibase, ids]) => {
				const url = this.wikibases[wikibase].api.getEntities({
					ids: ids,
					props: ['datatype'],
				});
				const data = await fetchJSON(url);
				if (data.entities) {
					for (const [localId, entity] of Object.entries(data.entities)) {
						this.datatypes[`${wikibase}:${localId}`] = entity.datatype;
					}
				}
			}),
		);
	}

	async add(id, useCache = true, options) {
		if (this.entities?.[id] && useCache) {
			return this.entities[id];
		}
		const [wikibase, entity] = id.split(':');
		const url = this.wikibases[wikibase].api.getEntities({
			ids: [entity],
			language: options?.languages ?? this.languages,
		});

		const result = await fetchJSON(url);

		const entityWithContext = await this.entityAddContext({
			entity: result.entities[entity],
			wikibase: wikibase,
		});

		this.entities[id] = entityWithContext;

		return this.entities[id];
	}
	idAddNamespace(id, wikibase) {
		const entitySource = this.wikibases?.[wikibase]?.entitySources?.[id.charAt(0)];
		if (entitySource) {
			return `${entitySource}:${id}`;
		}
		return `${wikibase}:${id}`;
	}
	async entityAddContext({ entity, wikibase }) {
		entity.wikibase = wikibase;
		if (entity.lexicalCategory) {
			entity.lexicalCategory = this.idAddNamespace(
				entity.lexicalCategory,
				wikibase,
			);
		}
		if (entity.language) {
			entity.language = this.idAddNamespace(entity.language, wikibase);
		}
		if (entity?.grammaticalFeatures?.length > 0) {
			entity.grammaticalFeatures = entity.grammaticalFeatures.map(id =>
				this.idAddNamespace(id, wikibase),
			);
		}

		const missingDatatypes = [];

		const iterate = item => {
			if (Array.isArray(item)) {
				// If the item is an array, iterate over its elements
				item.forEach(element => iterate(element));
			} else if (typeof item === 'object' && item !== null) {
				// If the item is an object, iterate over its properties
				for (const key in item) {
					if (Object.hasOwnProperty.call(item, key)) {
						if (key === 'id' && typeof item.id === 'string') {
							item.id = this.idAddNamespace(item[key], wikibase);
						} else if (key === 'property') {
							item.property = this.idAddNamespace(item[key], wikibase);
						} else if (key === 'unit' && item.unit !== '1') {
							item.unit = this.idFromEntityUrl(item[key]);
						} else if (key === 'calendarmodel') {
							item.calendarmodel = this.idFromEntityUrl(item[key]);
						} else {
							// Otherwise, recursively call the function for nested objects/arrays
							iterate(item[key]);
						}
					}
				}
				// datatype is missing on shared properties.
				if ('datavalue' in item && !('datatype' in item)) {
					missingDatatypes.push(item);
				}
			}
		};
		iterate(entity);

		if (missingDatatypes.length > 0) {
			const propertyIds = missingDatatypes.map(item => item.property);
			await this.resolveDatatypes(propertyIds);
			for (const item of missingDatatypes) {
				if (this.datatypes[item.property]) {
					item.datatype = this.datatypes[item.property];
				}
			}
		}

		return entity;
	}
	async fetchLanguages(wikibase, context) {
		const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
		const url = new URL(endPoint);
		url.search = new URLSearchParams({
			action: 'query',
			meta: 'wbcontentlanguages',
			uselang: this.wikibases[wikibase].languages[0].replace(/-.+/, ''),
			wbclcontext: context,
			wbclprop: 'code|name',
			format: 'json',
		});

		try {
			const data = await fetchJSON(url);
			const languagesData = data.query.wbcontentlanguages;

			const languages = Object.keys(languagesData).map(
				key => languagesData[key].code,
			);

			const languageNames = Object.keys(languagesData).reduce((acc, key) => {
				acc[languagesData[key].code] = languagesData[key].name;
				return acc;
			}, {});

			return { languages: languages, languageNames: languageNames };
		} catch (error) {
			console.error('Failed to fetch languages:', error);
		}
	}

	async validateLanguage(code, context, wikibase) {
		const lowerCaseCode = code.toLowerCase();

		const { languages: validLanguages } = await this.fetchLanguages(
			wikibase.id,
			context ?? 'term',
		);

		if (validLanguages.includes(lowerCaseCode)) {
			return lowerCaseCode;
		}

		const parts = lowerCaseCode.split('-');
		if (parts.length > 1) {
			const primaryCode = parts[0];
			if (validLanguages.includes(primaryCode)) {
				return primaryCode;
			}
		}

		return this.wikibases[wikibase.id]?.languages?.[0];
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

		const result = await fetchJSON(url);

		this.designators[id] = result.entities[entity];

		return await this.entityAddContext({
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
	async hasEditPermissions(instance) {
		const endpoint = this.wikibases[instance].api.instance.apiEndpoint;
		try {
			const data = await fetchJSON(
				`${endpoint}?action=query&meta=userinfo&uiprop=rights&format=json`,
			);
			const rights = data.query.userinfo.rights;

			return rights.includes('edit');
		} catch (error) {
			return false;
		}
	}
	async fetchPropOrder(wikibase) {
		if (!('propOrder' in this.wikibases[wikibase])) {
			const endPoint = this.wikibases[wikibase].api.instance.apiEndpoint;
			try {
				const data = await fetchJSON(
					`${endPoint}?action=query&titles=MediaWiki:Wikibase-SortedProperties&prop=revisions&rvprop=content&format=json&origin=*`,
				);
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
	async fetchPropIcons(name) {
		const wikibase = this.wikibases[name];

		if ('propIcons' in wikibase) {
			return this.wikibases[wikibase].propIcons;
		}
		const icons = await wikibase.manager.queryManager.query(
			wikibase,
			wikibase.manager.queryManager.queries.propertyIcons,
		);
		wikibase.propIcons = icons;
		return icons;
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
			return this.wikibases[wikibase].icon;
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
