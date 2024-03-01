export const urlMatchPattern = {
	requiredProps: [
		'hasCharacteristic',
		'instanceOf',
		'urlMatchPattern',
		'urlMatchReplacementValue',
		'websiteTitleExtractPattern',
	],
	requiredItems: [
		'allCaps',
		'caseInsensitive',
		'lowercase',
		'propertyLinkingToArticlesInMediaWikiWebsites',
	],
	query: ({ instance, params }) => `
		SELECT ?p ?s ?r ?c ?t WHERE {
			?stat ps:${instance.props.urlMatchPattern} ?s.
			OPTIONAL { ?stat pq:${instance.props.urlMatchReplacementValue} ?r. }
			OPTIONAL { ?stat pq:${instance.props.websiteTitleExtractPattern} ?t }
			?prop p:${instance.props.urlMatchPattern} ?stat.
			BIND(IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.allCaps}}, 'upper',
				IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.lowercase}}, 'lower',
					IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.caseInsensitive}}, 'insensitive', '')
				)
			) AS ?c)
			BIND(REPLACE(STR(?prop), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?p).
			${
				instance?.props?.mastodonAddress
					? `FILTER (?p != '${instance.props.mastodonAddress}')
			`
					: ''
			}
			${
				instance?.items?.obsoleteProperty
					? `
				MINUS {
					?prop wdt:${instance.props.instanceOf} wd:${instance.items.obsoleteProperty}.
				}
			`
					: ''
			}
			MINUS {
				?prop wikibase:propertyType wikibase:GlobeCoordinate.
		    }
			${/* giving a high priority to ids representing wiki articles */ ''}
			${
				instance?.items?.propertyLinkingToArticlesInMediaWikiWebsites
					? `
				OPTIONAL {
					?prop wdt:${instance.props.instanceOf} wd:${instance.items.propertyLinkingToArticlesInMediaWikiWebsites}.
					BIND(1 as ?prio)
				}
			`
					: ''
			}

			${/* giving a low priority to ids representing a full url */ ''}
			OPTIONAL {
				?prop wikibase:propertyType wikibase:Url.
				BIND(3 as ?prio)
			}
			${/* giving everything else a default priority */ ''}
			BIND(IF(BOUND(?prio),?prio,2) AS ?prio).
		} ORDER BY ?prio STRLEN(str(?s))
	`,
	cacheTag: ({ instance, params }) =>
		`url-match-patterns:${instance.props.shortTitle}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = [];
		results.bindings.forEach(bind => {
			let isValid = true;
			let regexp = false;
			try {
				regexp = new RegExp(bind.s.value + '.*', 'g');
			} catch (e) {
				isValid = false;
				console.warn(
					`This regex is not valid ${JSON.stringify(bind, null, 2)}`,
				);
			}
			if (isValid) {
				processed.push({
					property: bind.p.value,
					search: regexp,
					replace:
						'r' in bind ? bind.r.value.replace(/\\(\d+)/g, '$$$1') : '$1',
					format: 'c' in bind ? bind.c.value : '',
					title: 't' in bind ? bind.t.value : '',
				});
			}
		});
		return processed;
	},
};
