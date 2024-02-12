const wikibases = {
	wikidata: {
		instance: 'https://www.wikidata.org',
		sparqlEndpoint: 'https://query.wikidata.org/sparql',
		props: {
			shortTitle: 'P1813',
			unitSymbol: 'P5061',
			formatterURL: 'P1630',
			thirdPartyFormatterURL: 'P3303',
			mobileFormatterURL: 'P7250',
			appliesIfRegularExpressionMatches: 'P8460', 
		},
		badResolvers: [
			'https://wikidata-externalid-url.toolforge.org/',
			'https://web.archive.org/web/',
			'https://resolve.eidr.org/',
		]
	},
	testWikidata: {
		instance: 'https://test.wikidata.org',
	},
	osmWiki: {
		instance: 'https://wiki.openstreetmap.org',
		sparqlEndpoint: 'https://sophox.org/sparql',
	}, 
	datatrek: {
		instance: 'https://data.wikitrek.org',
  		wgScriptPath: '/dt',
	},
	wikibaseWorld: {
		instance: 'https://wikibase.world',
		sparqlEndpoint: 'https://wikibase.world/query/sparql',
	},
	commons: {
		instance: 'https://commons.wikimedia.org',
		sparqlEndpoint: 'https://wikibase.world/query/sparql',
	}
}

export default wikibases