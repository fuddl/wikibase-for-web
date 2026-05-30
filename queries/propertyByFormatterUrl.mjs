export const propertyByFormatterUrl = {
    id: 'propertyByFormatterUrl',
    requiredProps: ['formatterURL'],
    query: ({ instance, params }) => `
		SELECT ?prop WHERE {
			VALUES ?pattern {
				'${params.url}/wiki/$1'
                '${params.url}/entity/$1'
                '${params.url}/wiki/Item:$1'
			} 
			?prop t:${instance.props.formatterURL} ?pattern
		}
	`,
    cacheTag: ({ instance, params }) =>
        `propertyByFormatterUrl:${instance.instance}:${params.url}`,
    postProcess: ({ results }, params, instance) => {
        const output = [];
        results.bindings.forEach(result => {
            const id = result.prop.value
                .replace(`${instance.instance}/entity/`, '')
                .replace(`${instance.instance.replace(/^https/, 'http')}/entity/`, '')
            output.push(id);
        });
        return output;
    },
};
