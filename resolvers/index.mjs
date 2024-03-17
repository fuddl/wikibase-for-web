import { wikibase } from './wikibase.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { url } from './url.mjs';
import wikibases from '../wikibases.mjs';
import WikiBaseQueryManager from '../queries/index.mjs';

const queryManager = new WikiBaseQueryManager();

const resolvers = {
	list: [wikibase, urlMatchPattern, url],
};

const resolvedCache = {};

resolvers.resolve = async function (url, allowedWikibases = ['playground']) {
	if (url in resolvedCache) {
		return resolvedCache[url];
	}

	let candidates = [];
	await Promise.all(
		this.list.map(async resolver => {
			await Promise.all(
				Object.keys(wikibases).map(async name => {
					if (allowedWikibases && !allowedWikibases.includes(name)) {
						return;
					}
					const context = {
						wikibase: wikibases[name],
						queryManager: queryManager,
						wikibaseID: name,
					};
					const applies = await resolver.applies(url, context);
					if (applies.length > 0) {
						for (const apply of applies) {
							apply.resolved = await resolver.resolve(apply, context);
						}
						candidates = [...candidates, ...applies];
					}
				}),
			);
		}),
	);

	candidates.sort((a, b) => b.specificity - a.specificity);

	resolvedCache[url] = candidates;

	return candidates;
};

export { resolvers };
