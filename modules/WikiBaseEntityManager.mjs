import wikibases from '../wikibases.mjs'
import { WBK } from '../node_modules/wikibase-sdk/dist/src/wikibase-sdk.js'

class WikiBaseEntityManager {
  constructor(params) {
    this.instances = wikibases
    this.labelsAndDescrptionsCache = {}
    this.entities = []
    this.activateCallback = params.activateCallback

    for (const name in this.instances) {
      this.instances[name].api = WBK({
        instance: this.instances[name].instance,
        sparqlEndpoint: this.instances[name]?.sparqlEndpoint,
        wgScriptPath: this.instances[name]?.wgScriptPath ?? '/w',
      })
      this.instances[name].id = name
      this.instances[name].getEntityLink = (id) => {
        return this.getEntityLink(`${name}:${id}`)
      }
      this.instances[name].fetchEntity = (id) => {
        return this.fetchEntity(`${name}:${id}`)
      }
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
      languages: [ 'en', 'fr', 'de' ], 
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
}

export default WikiBaseEntityManager
