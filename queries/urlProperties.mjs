export const urlProperties = {
	id: 'url-properties',
	requiredProps: [],
	query: ({ instance, params }) => `
		SELECT DISTINCT ?prop WHERE {
			?prop wikibase:propertyType wikibase:Url.
  	}
	`,
	cacheTag: ({ instance, params }) => `wikibase-url:${instance.instance}`,
	postProcess: ({ results }) => {
		return results.bindings.map(result =>
			result.prop.value.replace(/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/, '$1'),
		);
	},
};
