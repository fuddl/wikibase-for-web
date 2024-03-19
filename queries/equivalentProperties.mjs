export const equivalentProperties = {
	requiredProps: [
		'equivalentProperty',
		'subpropertyOf',
		'propertyConstraint',
		'propertyScope',
	],
	requiredItems: ['propertyScopeConstraint', 'asMainValue'],
	query: ({ instance, params }) => {
		const http = params.property.replace(/^https:/, 'http:');
		const https = params.property.replace(/^http:/, 'https:');
		return `
			SELECT DISTINCT ?prop ?parent ?type {
				{
					?property p:${instance.props.equivalentProperty}/ps:${instance.props.equivalentProperty} <${http}>.
				} UNION {
					?property p:${instance.props.equivalentProperty}/ps:${instance.props.equivalentProperty} <${https}>.
				}
				?subproperty wdt:${instance.props.subpropertyOf} * ?property.

				?property wikibase:propertyType ?propType.
				BIND (REPLACE(STR(?propType), '.*#([A-Za-z]+)$', '$1') AS ?type)

				?subproperty p:${instance.props.propertyConstraint} ?psc.
				?psc ps:${instance.props.propertyConstraint} wd:${instance.items.propertyScopeConstraint}.
				?psc pq:${instance.props.propertyScope} wd:${instance.items.asMainValue}.

				OPTIONAL { ?subproperty p:${instance.props.equivalentProperty} [ wikibase:rank ?rank ] }
				BIND (REPLACE(STR(?subproperty), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?prop)
				BIND (IF(?property = ?subproperty, "", REPLACE(STR(?subproperty), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1')) AS ?parent) 

				BIND (IF(?rank = wikibase:PreferredRank, 1, IF(?rank = wikibase:NormalRank, 2, 3)) AS ?order) 
			}
			ORDER BY ?order
	`;
	},
	cacheTag: ({ instance, params }) => `equivalentProperties:${params.property}`,
	postProcess: ({ results }) => {
		const processed = [];

		results.bindings.forEach(bind => {
			processed.push({
				prop: bind.prop.value,
				parent: bind.parent.value,
				type: bind.type.value,
			});
		});
		return processed;
	},
};
