import wikibases from '../wikibases.mjs'
import { WBK } from '../node_modules/wikibase-sdk/dist/src/wikibase-sdk.js'
import queries from '../queries/index.mjs'

class WikiBaseEntityManager {
  constructor(params) {
    this.instances = wikibases
    this.labelsAndDescrptionsCache = {}
    this.entities = []
    this.activateCallback = params.activateCallback
    this.languages = params.languages
    this.queries = queries

    this.queryCache = {}

    for (const name in this.instances) {
      const wgScriptPath = this.instances[name]?.wgScriptPath ?? '/w'
      this.instances[name].api = WBK({
        instance: this.instances[name].instance,
        sparqlEndpoint: this.instances[name]?.sparqlEndpoint,
        wgScriptPath: wgScriptPath,
      })
      this.instances[name].id = name
      this.instances[name].getEntityLink = (id) => {
        return this.getEntityLink(`${name}:${id}`)
      }
      this.instances[name].fetchEntity = (id) => {
        return this.fetchEntity(`${name}:${id}`)
      }
      this.instances[name].wikiRoot = `${this.instances[name].instance}${wgScriptPath}`
      this.instances[name].query = async (queryId, params) => {
        return this.query(this.instances[name], this.queries[queryId], params)
      }
      this.instances[name].queryCached = (queryId, params) => {
        return this.queryCached(this.instances[name], this.queries[queryId], params)
      }
      // @todo add babel languages from instance
      this.instances[name].languages = this.languages
    }
  }

  // Method to add a new entity to the instances object
  addEntity(id) {
    this.entities.find(entity => entity.id === id) || this.entities.push({ id: id })
  }

  async activate(id) {
    this.entities.forEach((entity) => {
      entity.active = entity.id === id
    })

    await Promise.all(this.entities.map(async (entity) => {
      if (entity.active && !entity.data) {
        entity.data = await this.fetchEntity(entity.id)
        await this.fetchPropOrder(entity.id)
      }
    }))
    this.activateCallback(this)
  }
  
  async addAndActivate(id) {
    this.addEntity(id)
    await this.activate(id)
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
    const { id: internalId } = this.extractIdComponents(globalId)
    return result.entities[internalId]
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
        console.error(e)
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

  queryCached(instance, q, params) {
    if (q?.requiredProps && !this.checkRequiredProps(instance, q.requiredProps)) {
      return []
    }
    
    const queryCacheTag = `${instance.id}:${q.cacheTag({ params, instance })}`

    if (!('sparqlEndpoint' in instance)) {
      this.queryCache[queryCacheTag] = []
      return []
    }

    // if its already cached, return cache
    if (queryCacheTag in this.queryCache) {
      return this.queryCache[queryCacheTag]
    } else {
      return false
    }
  }

  async query(instance, q, params) {
    if (q?.requiredProps && !this.checkRequiredProps(instance, q.requiredProps)) {
      return []
    }

    const queryCacheTag = `${instance.id}:${q.cacheTag({ params, instance })}`

    const cached = this.queryCached(instance, q, params)
    if (cached) {
      return cached
    }

    if (!('sparqlEndpoint' in instance)) {
      this.queryCache[queryCacheTag] = []
      return []
    }

    const query = q.query({ params, instance })
    const queryUrl = instance.api.sparqlQuery(query)
    const queryResult = await fetch(queryUrl).then(res => res.json())
    const processedResult = q?.postProcess ? q.postProcess(queryResult) : queryResult
    this.queryCache[queryCacheTag] = processedResult

    return processedResult
  }

  checkRequiredProps (instance, requirements) {
    return requirements.every((requirement) => requirement in (instance?.props ?? {}))
  }
}

export default WikiBaseEntityManager
