export const expectedIds = {
	id: 'expected-ids',
	requiredProps: [
		'autosuggestValue',
		'instanceOf',
		'languageOfWorkOrName',
		'propertiesForThisType',
		'property',
		'propertyConstraint',
		'searchFormatterURL',
		'sourceWebsiteForTheProperty',
		'subclassOf',
	],
	requiredItems: ['singleValueConstraint', 'itemRequiresStatementConstraint'],
	query: ({ instance, params }) => {
		return `
			SELECT DISTINCT ?class ?prop ?value ?search ?searchLang ?contextUrl ?url WHERE {

				{
					wd:${params.subject} wdt:${instance.props.instanceOf} ?class .
				}
					UNION
				{
					wd:${params.subject} wdt:${instance.props.instanceOf} ?instance .
					?instance wdt:${instance.props.subclassOf}* ?class .
				}


				?class p:${instance.props.propertiesForThisType} ?props.
				?props ps:${instance.props.propertiesForThisType} ?prop.
				?prop wikibase:propertyType wikibase:ExternalId.

				OPTIONAL {
				  ?prop p:${instance.props.searchFormatterURL} ?searchprop.
				  ?searchprop ps:${instance.props.searchFormatterURL} ?search.
				  ?searchprop rdf:type wikibase:BestRank.
				  ${
						'fileFormat' in instance.props && 'JSON' in instance.items
							? /* do not list json searches. we only need human readable formats */
								`MINUS {
				  				?searchprop pq:${instance.props.fileFormat} wd:${instance.items.JSON}.
				  			}`
							: ''
					}
				  
				  OPTIONAL {
				 	 	?searchprop pq:${instance.props.languageOfWorkOrName} ?lang.
				    ?lang wdt:${instance.props.wikimediaLanguageCode} ?searchLang. 
				  }
				}
				OPTIONAL { ?prop wdt:${instance.props.url} ?url. }
			}
	`;
	},
	cacheTag: ({ instance, params }) => `expectedIds:${params.class}`,
	postProcess: ({ results }, params, instance) => {
		const processed = [];

		results.bindings.forEach(bind => {
			processed.push({
				class: bind.class.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					`${instance.id}:$1`,
				),
				prop: bind.prop.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					`${instance.id}:$1`,
				),
				search: bind?.search?.value ?? '',
				searchLang: bind?.searchLang?.value ?? 'mul',
				contextUrl: bind?.contextUrl?.value ?? '',
				url: bind?.url?.value ?? '',
			});
		});
		return processed;
	},
};
