export const urlProperties = {
	requiredProps: [],
	query: ({ instance, params }) => `
		SELECT DISTINCT ?p WHERE {
			?prop wikibase:propertyType wikibase:Url.
  		BIND(REPLACE(STR(?prop), '^.*/(P[0-9]+)$', '$1') AS ?p)
  	}
	`,
	cacheTag: ({ instance, params }) => `wikibase-url:${instance.instance}`,
	postProcess: ({ results }) => {
		return results.bindings.map(result => result.p.value);
	},
};
