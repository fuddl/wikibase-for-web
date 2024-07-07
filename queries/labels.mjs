export const labels = {
	id: 'labels',
	requiredProps: [],
	query: ({ instance, params }) => `
		SELECT ?i ?iLabel WHERE {
			VALUES ?i { ${params.items.map(item => `wd:${item}`).join(' ')} }
			SERVICE wikibase:label { bd:serviceParam wikibase:language "${instance.languages.join(', ')}". }
		}
	`,
	cacheTag: ({ instance, params }) =>
		`labels:${instance.instance}:${params.items.map(item => `wd:${item}`).join(' ')}`,
	postProcess: ({ results }) => {
		const output = {};
		results.bindings.forEach(result => {
			const id = result.i.value.replace(
				/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
				'$1',
			);
			output[id] = result.iLabel.value;
		});
		return output;
	},
};
