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
				SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }


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
			console.debug(bind.url);
			console.debug(bind.contextUrl);
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
		console.debug(processed);
		return processed;
	},
};
