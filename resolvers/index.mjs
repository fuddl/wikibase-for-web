import { wikidata } from './wikidata.mjs';
const resolvers = {
	list: [
		wikidata,
	],
}

resolvers.resolve = function (url) {
	let result = ''
	this.list.forEach((resolver) => {
		if (resolver.applies(url)) {
			const entity = resolver.resolve(url)
			result = `wikidata:${entity}`
		}
	})
	return result
}

export { resolvers }