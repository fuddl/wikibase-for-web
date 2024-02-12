import { wikibase } from './wikibase.mjs';
import wikibases from '../wikibases.mjs'

const resolvers = {
	list: [
		wikibase,
	],
}

const resolvedCache = {}

resolvers.resolve = function (url) {
	if (url in resolvedCache) {
		return resolvedCache[url]
	}

	let results = []
	Object.keys(wikibases).forEach((name) => {
		this.list.forEach((resolver) => {
			const context = { ...wikibases[name], id: name }
			if (resolver.applies(url, context)) {
				const resolved = resolver.resolve(url, context)
				resolvedCache[url] = resolvedCache[url] ? [...resolvedCache[url], resolved] : [resolved]
				
				results.push(resolved)
			}
		})
	})
	return results
}

export { resolvers }