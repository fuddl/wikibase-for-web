export const itemByDomain = {
	id: 'item-by-domain',
	requiredProps: ['domain'],
	query: ({ instance, params }) => `
		SELECT ?item ?domain WHERE {
		  VALUES ?domain { ${params.domains.map(domain => `"${domain}"`).join(' ')} }
		  ?item wdt:${instance.props.domainName} ?domain.
		}
		ORDER BY DESC(STRLEN(STR(?domain)))
		LIMIT 10
	`,
	cacheTag: ({ instance, params }) =>
		`domains:${params.domains.join('/')}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push({
				item: bind.item.value.match(/\w\d+(?:-\w\d+)?$/)[0],
				domain: bind.domain.value,
			})
		});
		return processed;
	},
};
