export const urlMatchPatternByDomain = {
	id: 'url-match-patterns-by-domain',
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
		'bigInteger',
		'propertyLinkingToArticlesInMediaWikiWebsites',
	],
	query: ({ instance, params }) => {
		// Return empty query if domainName prop doesn't exist
		if (!instance?.props?.domainName) {
			return `SELECT ?p ?s ?r ?c ?t ?d WHERE { FILTER(false) }`;
		}
		
		return `
		SELECT ?p ?s ?r ?c ?t ?d WHERE {
			?stat ps:${instance.props.urlMatchPattern} ?s.
			OPTIONAL { ?stat pq:${instance.props.urlMatchReplacementValue} ?r. }
			OPTIONAL { ?stat pq:${instance.props.websiteTitleExtractPattern} ?t }
			OPTIONAL { ?stat pq:${instance.props.domainName} ?d }
			?prop p:${instance.props.urlMatchPattern} ?stat.
			BIND(IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.allCaps}}, 'upper',
				IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.lowercase}}, 'lower',
					IF(EXISTS{?prop wdt:${instance.props.hasCharacteristic} wd:${instance.items.caseInsensitive}}, 'insensitive',
						IF(EXISTS { ?stat pq:${instance.props.hasCharacteristic} wd:${instance.items.bigInteger}.}, 'bigint', '')
					)
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
			
			${
				params?.domains?.length
					? `FILTER (?d IN (${params.domains.map(d => `"${d}"`).join(', ')}))`
					: ''
			}
			
			BIND(IF(BOUND(?prio),?prio,2) AS ?prio).
		} ORDER BY ?prio STRLEN(str(?s))
	`;
	},
	cacheTag: ({ instance, params }) =>
		`url-match-patterns-by-domain:${params.domains?.join(',')}`,
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
					domain: 'd' in bind ? bind.d.value : '',
				});
			}
		});
		return processed;
	},
}; 