import { shortTitle } from './shortTitle.mjs'
import { unitSymbol } from './unitSymbol.mjs'
import { urlMatchPattern } from './urlMatchPattern.mjs'
import { itemByExternalId } from './itemByExternalId.mjs'

const queries = {
	shortTitle,
	unitSymbol,
	urlMatchPattern,
	itemByExternalId,
}

class WikiBaseQueryManager {
	constructor(params) {
		this.cache = {}
		this.queries = queries
	}

	queryCached(instance, queryObject, params) {
		if (queryObject?.requiredProps && !this.checkRequiredProps(instance, queryObject.requiredProps)) {
			return []
		}
		
		const queryCacheTag = `${instance.id}:${queryObject.cacheTag({ params, instance })}`

		if (!('sparqlEndpoint' in instance)) {
			this.cache[queryCacheTag] = []
			return []
		}

		// if its already cached, return cache
		if (queryCacheTag in this.cache) {
			return this.cache[queryCacheTag]
		} else {
			return false
		}
	}

	async query(instance, queryObject, params) {
		if (queryObject?.requiredProps && !this.checkRequiredProps(instance, queryObject.requiredProps)) {
			return []
		}


		const queryCacheTag = `${instance.id}:${queryObject.cacheTag({ params, instance })}`

		const cached = this.queryCached(instance, queryObject, params)
		if (cached) {
			return cached
		}

		if (!('sparqlEndpoint' in instance)) {
			this.cache[queryCacheTag] = []
			return []
		}

		const query = queryObject.query({ params, instance })
		const queryUrl = instance.api.sparqlQuery(query)
		const queryResult = await fetch(queryUrl).then(res => res.json())
		const processedResult = queryObject?.postProcess ? queryObject.postProcess(queryResult) : queryResult
		this.cache[queryCacheTag] = processedResult

		return processedResult
	}

	checkRequiredProps (instance, requirements) {
		return requirements.every((requirement) => requirement in (instance?.props ?? {}))
	}
}

export default WikiBaseQueryManager