export const languageByIso6391Code = {
	id: 'labels',
	requiredProps: ['iso6391Code'],
	query: ({ instance, params }) => `
		SELECT ?language WHERE {
		  ?language wdt:${instance.props.iso6391Code} '${params.code}'.
		}
		LIMIT 1
	`,
	cacheTag: ({ instance, params }) =>
		`langaugeCode:${instance.instance}:${params.code}`,
	postProcess: ({ results }) => {
		const output = [];
		results.bindings.forEach(result => {
			if (result?.language?.value) {
				output.push(result.language.value.replace(/.+\/(Q\d+)$/, '$1'));
			}
		});
		return output;
	},
};
