import { wikibase } from './wikibase.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import wikibases from '../wikibases.mjs'
import WikiBaseQueryManager from '../queries/index.mjs'

const queryManager = new WikiBaseQueryManager()

const resolvers = {
	list: [
		wikibase,
		urlMatchPattern,
	],
}

const resolvedCache = {}

resolvers.resolve = async function (url) {
	if (url in resolvedCache) {
		return resolvedCache[url]
	}

	let results = []
	await Promise.all(this.list.map(async (resolver) => {
		await Promise.all(Object.keys(wikibases).map(async (name) => {
			const context = {
				wikibase: wikibases[name],
				queryManager: queryManager,
				wikibaseID: name,
			}
			if (await resolver.applies(url, context)) {
				const resolved = await resolver.resolve(url, context)

				results = [...results, ...resolved]
			}
		}))
	}))

	resolvedCache[url] = resolvedCache[url] ? [...resolvedCache[url], results] : [results]
	
	return results
}

export { resolvers }