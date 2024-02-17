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
	let candidates = []
	await Promise.all(this.list.map(async (resolver) => {
		await Promise.all(Object.keys(wikibases).map(async (name) => {
			const context = {
				wikibase: wikibases[name],
				queryManager: queryManager,
				wikibaseID: name,
			}
			const applies = await resolver.applies(url, context)
			if (applies === true || applies.length > 0) {
				const resolved = await resolver.resolve(url, context)

				if (applies.length) {
					candidates = [...candidates, ...applies]
				}

				results = [...results, ...resolved]
			}
		}))
	}))

	results.sort((a, b) => b.specificity - a.specificity);

	resolvedCache[url] = resolvedCache[url] ? [...resolvedCache[url], results] : [results]
	
	return { 
		resolved: results,
		candidates: candidates,
	}
}

export { resolvers }