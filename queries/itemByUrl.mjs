export const itemByUrl = {
	query: ({ instance, params }) => `
		SELECT ?url ?i WHERE {
			{
				${params.urls
					.map(
						url => `
					BIND(<${url}> AS ?url)
					?item ?predicate ?url.
				`,
					)
					.join('} UNION {')}
			}
			?property wikibase:directClaim ?predicate.
			BIND(REPLACE(STR(?item), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?i).
		}
	`,
	cacheTag: ({ instance, params }) => `url:${params.urls.join('/')}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push({
				item: bind.i.value,
				url: bind.url.value,
			});
		});
		return processed;
	},
};
