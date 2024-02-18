import wikibases from '../wikibases.mjs'
import WikiBaseQueryManager from '../queries/index.mjs'
import NavigationManager from './NavigationManager.mjs'

class WikiBaseEntityManager {
	constructor(params) {
		this.instances = wikibases
		this.labelsAndDescrptionsCache = {}
		this.entities = []
		this.render = params.render
		this.languages = params.languages
		this.activity = 'view'
		this.navigator = new NavigationManager

		this.queryManager = new WikiBaseQueryManager()

		for (const name in this.instances) {
			this.instances[name].getEntityLink = (id) => {
				return this.getEntityLink(`${name}:${id}`)
			}
			this.instances[name].fetchEntity = (id) => {
				return this.fetchEntity(`${name}:${id}`)
			}
			this.instances[name].query = async (queryId, params) => {
				return this.query(this.instances[name], this.queryManager.queries[queryId], params)
			}
			this.instances[name].queryCached = (queryId, params) => {
				return this.queryCached(this.instances[name], this.queryManager.queries[queryId], params)
			}
			// @todo add babel languages from instance
			this.instances[name].languages = this.languages
		}

		this.navigator.onStateChange(async (state) => {
			switch (state.activity) {
				case 'view':
					await this.addAndActivate(state.id)
					break;
				case 'select':
					await this.selector(state.ids)
					break;
			}
			this.render(this, state.activity)
		})

		this.navigator.onStateChange((state) => {
			switch (state.activity) {
				case 'view':
					const instance = this.getInstanceFromGlobalId(state.id)
					browser.sidebarAction.setTitle({
						title: instance.name,
					})
					if (instance.favicon) {
						browser.sidebarAction.setIcon({
							path: {
								128: browser.runtime.getURL(instance.favicon),
							},
						})
					} else {
						browser.sidebarAction.setIcon({path: null})
					}
					break;
				case 'select':
					browser.sidebarAction.setTitle({
						title: browser.i18n.getMessage('disambiguation_title'),
					})
					browser.sidebarAction.setIcon({path: {
						128: browser.runtime.getURL('icons/disambiguate.svg'),
					}})
					break;
			}
		})
	}

	// Method to add a new entity to the instances object
	addEntity(id) {
		this.entities.find(entity => entity.id === id) || this.entities.push({ id: id })
	}

	addEntities(ids) {
		ids.map((id) => this.addEntity(id))
	}

	async activate(ids) {
		this.entities.forEach((entity) => {
			entity.active = ids.includes(entity.id)
		})

		await Promise.all(this.entities.map(async (entity) => {
			if (entity.active && !entity.data) {
				entity.data = await this.fetchEntity(entity.id)
				await this.fetchPropOrder(entity.id)
			}
		}))
	}

	async selector(ids) {
		this.entities.forEach((entity) => {
			entity.selectable = ids.includes(entity.id)
		})

		await Promise.all(this.entities.map(async (entity) => {
			if (entity.selectable && !entity.data) {
				entity.data = await this.fetchEntity(entity.id)
			}
		}))
	}


	
	async addAndActivate(id) {
		this.addEntity(id)
		await this.activate([id])
	}

	extractIdComponents(externalId) {
		const parts = externalId.split(':')
		return {
			instance: parts[0], 
			id: parts[1],
		}
	}

	getInstance(instance) {
		return this.instances[instance]
	}

	getInstanceFromGlobalId(globalID) {
		const { instance } = this.extractIdComponents(globalID)
		return this.instances[instance]
	}

	getEntityUrl(id, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
		const components = this.extractIdComponents(id)
		return this.instances[components.instance].api.getEntities({
			ids: [ components.id ],
			languages: this.languages, 
			props: props,
			redirections: false,
		})
	}

	async fetchEntity(globalId, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
		const url = this.getEntityUrl(globalId, props)

		const result = await fetch(url).then(res => res.json())
		const { id: internalId, instance } = this.extractIdComponents(globalId)
		return this.entityAddContext({
			entity: result.entities[internalId],
			globalId: globalId,
			instance: instance,
		})
	}

	entityAddContext({ entity, globalId, instance }) {
		entity.instance = instance
		const iterate = (item, prefix) => {
			if (Array.isArray(item)) {
				// If the item is an array, iterate over its elements
				item.forEach((element) => iterate(element, prefix));
			} else if (typeof item === 'object' && item !== null) {
				// If the item is an object, iterate over its properties
				for (const key in item) {
					if (Object.hasOwnProperty.call(item, key)) {
						if (key === 'id' && !item.globalID) {
							item.globalID = `${instance}:${item[key]}`
						} else if (key === 'property' && !item.propertyGlobalID) {
							item.propertyGlobalID = `${instance}:${item[key]}`
						} else {
							// Otherwise, recursively call the function for nested objects/arrays
							iterate(item[key], prefix);
						}
					}
				}
			}
		}
		iterate(entity)
		return entity
	}

	async fetchPropOrder(globalId) {
		const { instance: instanceId } = this.extractIdComponents(globalId)
		const instance = this.getInstance(instanceId)
		if (!('propOrder' in instance)) {
			const endPoint = instance.api.instance.apiEndpoint
			try {
				const response = await fetch(`${endPoint}?action=query&titles=MediaWiki:Wikibase-SortedProperties&prop=revisions&rvprop=content&format=json&origin=*`)
				const data = await response.json()
				const pageId = Object.keys(data.query.pages)[0]
				const lastRevisionContent = data.query.pages[pageId].revisions[0]['*'];
				instance.propOrder = lastRevisionContent.match(/(P\d+)/g)

			} catch (e) {
				console.log(`Failed to load prop order from ${instance.id}`)
				console.log(e)
			}
		}
	}

	idFromEntityUrl(url) {
		const normalisedUrl = url.replace(/^http:/, 'https:')
		const instance = Object.keys(this.instances).find((name) => {
			return normalisedUrl.startsWith(this.instances[name].instance)
		})
		const id = url.match(/\/entity\/(\w(?:\d+\w)\d+)$/)[1]
		return `${instance}:${id}`
	}

	urlFromGlobalId(globalId) {
		const { id, instance: instanceId } = this.extractIdComponents(globalId)
		const instance = this.getInstance(instanceId)

		return `${instance.instance}/entity/${id}`
	}

	async fetchLabelsAndDescrptions(globalId) {
		const fetchResult = await this.fetchEntity(globalId, ['labels', 'descriptions'])
		this.labelsAndDescrptionsCache[globalId] = fetchResult
		return fetchResult
	}

	queryCached(instance, queryObject, params) {
		return this.queryManager.queryCached(instance, queryObject, params)
	}

	async query(instance, queryObject, params) {
		return await this.queryManager.query(instance, queryObject, params)
	}
}

export default WikiBaseEntityManager
