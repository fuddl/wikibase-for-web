export const instancesOrSubclasses = {
	id: 'instances-or-subclasses',
	requiredProps: ['subclassOf'],
	query: ({ instance, params }) => `
		SELECT ?subClass WHERE {
			VALUES ?superClass { ${params.superClasses.map(superClass => `wd:${superClass}`).join(' ')} }.
			?subClass wdt:${instance.props.subclassOf}* ?superClass.
			FILTER(STRSTARTS(STR(?subClass), "http://www.wikidata.org/entity/Q"))
		} LIMIT 50
	`,
	cacheTag: ({ instance, params }) =>
		`instances-or-subclasses:${params.superClasses.join('/')}`,
	postProcess: ({ results }) => {
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push(
				bind.subClass.value.replace(/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/, '$1'),
			);
		});
		return processed;
	},
};
