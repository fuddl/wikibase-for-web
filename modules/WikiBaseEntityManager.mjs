import wikibases from '../wikibases.mjs'
import { WBK } from '../node_modules/wikibase-sdk/dist/src/wikibase-sdk.js'

class WikiBaseEntityManager {
  constructor() {
    this.instances = wikibases
    this.entities = []

    for (const name in this.instances) {
      this.instances[name].api = WBK({
        instance: this.instances[name].instance,
        sparqlEndpoint: this.instances[name]?.sparqlEndpoint,
      })
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

  getEntityLink(id, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
    const components = this.extractIdComponents(id)
    return this.instances[components.instance].api.getEntities({
      ids: [ components.id ],
      languages: [ 'en', 'fr', 'de' ], 
      props: props,
      redirections: false,
    })
  }

  async fetchEntity(id, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
    const { id: internalId } = this.extractIdComponents(id)
    const url = this.getEntityLink(id, props)

    const result = await fetch(url).then(res => res.json())
    return result.entities[internalId]
  }
}

export default WikiBaseEntityManager