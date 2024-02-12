const wikibases = {
	wikidata: {
		instance: 'https://www.wikidata.org',
		sparqlEndpoint: 'https://query.wikidata.org/sparql',
		props: {
			shortTitle: 'P1813',
			unitSymbol: 'P5061',
		}
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