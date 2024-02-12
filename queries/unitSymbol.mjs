export const unitSymbol = {
	requiredProps: ['unitSymbol'],
	query: ({ instance, params }) => `
		SELECT ?u WHERE {
			wd:${params.subject} wdt:${instance.props.unitSymbol} ?u.
			BIND( LANG(?u) AS ?language).
			FILTER (?language in ('${instance.languages.join("', '")}'))
		} order by desc(strlen(?u))
	`,
	cacheTag: ({ instance, params }) => `${params.subject}:${instance.props.shortTitle}:${instance.languages.join("', '")}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return []
		}
		const processed = {}
		results.bindings.forEach((bind) => {
			const lang = bind.u["xml:lang"]
			if (lang in processed) {
				return
			}
			// format should be compatible with entity labels
			processed[lang] = {
				value: bind.u.value,
				language: lang,
			}
		})
		return processed
	}
}
