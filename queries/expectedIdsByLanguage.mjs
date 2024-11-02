export const expectedIdsByLanguage = {
	id: 'expected-ids-by-language',
	requiredProps: [
		'lexemeRequiresLanguageConstraint',
		'propertyConstraint',
		'searchFormatterURL',
	],
	requiredItems: ['singleValueConstraint', 'itemRequiresStatementConstraint'],
	query: ({ instance, params }) => {
		return `
			SELECT DISTINCT ?prop ?search ?url WHERE {
				SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }

				?prop p:${instance.props.propertyConstraint} ?cst. 
				?cst ps:${instance.props.propertyConstraint} wd:${instance.items.lexemeRequiresLanguageConstraint}.
				?cst pq:${instance.props.itemOfPropertyConstraint} wd:${params.language}.

				?prop wikibase:propertyType wikibase:ExternalId.

				OPTIONAL {
					?prop p:${instance.props.searchFormatterURL} ?searchprop.
					?searchprop ps:${instance.props.searchFormatterURL} ?search.
					?searchprop rdf:type wikibase:BestRank.
				}
			OPTIONAL { ?prop wdt:${instance.props.url} ?url. }
			}
	`;
	},
	cacheTag: ({ instance, params }) =>
		`expectedIdsByLanguage:${params.language}`,
	postProcess: ({ results }, params, instance) => {
		const processed = [];

		results.bindings.forEach(bind => {
			processed.push({
				prop: bind.prop.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					`${instance.id}:$1`,
				),
				search: bind?.search?.value ?? '',
				url: bind?.url?.value ?? '',
			});
		});

		return processed;
	},
};
