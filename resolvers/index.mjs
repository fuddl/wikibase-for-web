import { wikidata } from './wikidata.mjs';
import wikibases from '../wikibases.mjs'

const resolvers = {
	list: [
		wikidata,
	],
}

resolvers.resolve = function (url) {
	let results = []
	Object.keys(wikibases).forEach((name) => {
		this.list.forEach((resolver) => {
			const context = { ...wikibases[name], id: name }
			if (resolver.applies(url, context)) {
				results.push(resolver.resolve(url, context))
			}
		})
	})
	return results
}

export { resolvers }