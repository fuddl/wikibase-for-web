export const languageByIETF = {
	id: 'language-by-ietgf',
	requiredProps: ['IETFLanguageTag'],
	query: ({ instance, params }) => `
		SELECT ?item
		WHERE {

		  ?item wdt:${instance.props.IETFLanguageTag} ?tagValue .

		  FILTER (lcase(str(?tagValue)) = "${params.lang.toLowerCase()}")
		} LIMIT 1
	`,
	cacheTag: ({ instance, params }) => `ietf:${params.lang}`,
	postProcess: ({ results }) => {
		if (results.bindings.length > 0) {
			return results.bindings[0].item.value.replace(
				/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
				'$1',
			);
		}
		return null;
	},
};
