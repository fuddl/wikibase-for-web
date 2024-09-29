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
			SELECT DISTINCT ?class ?prop ?value ?search ?searchLang ?contextUrl ?url ?single ?constraintProp ?constraintItem WHERE {
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
				BIND(EXISTS{?prop wdt:${instance.props.propertyConstraint} wd:${instance.items.singleValueConstraint}} AS ?single)
				OPTIONAL { ?props pq:${instance.props.autosuggestValue} ?value. }
				{
					?props pq:${instance.props.searchFormatterURL} ?search.
					OPTIONAL {
						?props pq:${instance.props.sourceWebsiteForTheProperty} ?contextUrl.
					}
				} UNION {
				  ?prop p:${instance.props.searchFormatterURL} ?searchprop.
				  ?searchprop ps:${instance.props.searchFormatterURL} ?search.
				  OPTIONAL {
				 	 	?searchprop pq:${instance.props.languageOfWorkOrName} ?lang.
				    ?lang wdt:${instance.props.wikimediaLanguageCode} ?searchLang. 
				  }
				}
				OPTIONAL {
					?prop p:${instance.props.propertyConstraint} ?cst.
					?cst ps:${instance.props.propertyConstraint} wd:${instance.items.itemRequiresStatementConstraint}.
					OPTIONAL {
						?cst pq:${instance.props.property} ?constraintProp. 
					}
					OPTIONAL {
						?cst pq:${instance.props.itemOfPropertyConstraint} ?constraintItem.
					}
				}
				OPTIONAL { ?prop wdt:${instance.props.url} ?url. }
			}
	`;
	},
	cacheTag: ({ instance, params }) => `expectedIds:${params.class}`,
	postProcess: ({ results }, params, instance) => {
		const processed = [];

		const seen = [];

		results.bindings.forEach(bind => {
			if (seen.includes(bind.prop.value)) {
				return;
			}
			seen.push(bind.prop.value);
			processed.push({
				class: bind.class.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					`${instance.id}:$1`,
				),
				prop: bind.prop.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					`${instance.id}:$1`,
				),
				search: bind.search.value,
				searchLang: bind?.searchLang?.value ?? 'mul',
			});
		});
		console.debug(seen);
		return processed;
	},
};
