export const shortTitle = {
	requiredProps: ['shortTitle'],
	query: ({ instance, params }) => `
		SELECT ?short WHERE {
			wd:${params.subject} wdt:${instance.props.shortTitle} ?short.
			BIND( LANG(?short) AS ?language).
			FILTER (?language in ('${instance.languages.join("', '")}'))
		} order by desc(strlen(?short))
	`,
	cacheTag: ({ instance, params }) =>
		`${params.subject}:${instance.props.shortTitle}:${instance.languages.join("', '")}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = {};
		results.bindings.forEach(bind => {
			const lang = bind.short['xml:lang'];
			if (lang in processed) {
				return;
			}
			// format should be compatible with entity labels
			processed[lang] = {
				value: bind.short.value,
				language: lang,
			};
		});
		return processed;
	},
};
