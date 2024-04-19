export const equivalentClasses = {
	id: 'equivalent-class',
	requiredProps: ['equivalentClass', 'subclassOf'],
	query: ({ instance, params }) => {
		const http = params.class.replace(/^https:/, 'http:');
		const https = params.class.replace(/^http:/, 'https:');
		return `
			SELECT DISTINCT ?item WHERE {
				{
					VALUES ?url { <${http}> <${https}> }
					?item wdt:${instance.props.equivalentClass} ?url.
				} UNION {
					VALUES ?url { <${http}> <${https}> }
          ?parent wdt:${instance.props.equivalentClass} ?url.

					?item wdt:${instance.props.subclassOf} ?parent.
				}
			}
			LIMIT 20
	`;
	},
	cacheTag: ({ instance, params }) => `equivalentClasses:${params.class}`,
	postProcess: ({ results }, params) => {
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push(
				bind.i.value.replace(/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/, '$1'),
			);
		});
		return processed;
	},
};
