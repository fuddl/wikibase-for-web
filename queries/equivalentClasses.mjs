export const equivalentClasses = {
	requiredProps: ['equivalentClass', 'subclassOf'],
	query: ({ instance, params }) => {
		const http = params.class.replace(/^https:/, 'http:');
		const https = params.class.replace(/^http:/, 'https:');
		return `
			SELECT DISTINCT ?i WHERE {
				{
					{
						?item wdt:${instance.props.equivalentClass} <${http}>;
					} UNION {
						?item wdt:${instance.props.equivalentClass} <${https}>;
					}
				} UNION {
					{
						?parent wdt:${instance.props.equivalentClass} <${http}>;
					} UNION {
						?parent wdt:${instance.props.equivalentClass} <${https}>;
					}
					?item wdt:${instance.props.subclassOf} ?parent.
				}
				BIND(REPLACE(STR(?item), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?i).

			}
			LIMIT 20
	`;
	},
	cacheTag: ({ instance, params }) => `equivalentClasses:${params.class}`,
	postProcess: ({ results }) => {
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push(bind.i.value);
		});
		return processed;
	},
};
