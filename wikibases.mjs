import { WBK } from './node_modules/wikibase-sdk/dist/src/wikibase-sdk.js'

const wikibases = {
	wikidata: {
		name: 'Wikidata',
		color: '#069',
		instance: 'https://www.wikidata.org',
		sparqlEndpoint: 'https://query.wikidata.org/sparql',
		favicon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Wikidata_Favicon_color.svg',
		props: {
			appliesIfRegularExpressionMatches: 'P8460', 
			formatterURL: 'P1630',
			hasCharacteristic: 'P1552',
			instanceOf: 'P31',
			mastodonAddress: 'P4033',
			mobileFormatterURL: 'P7250',
			shortTitle: 'P1813',
			thirdPartyFormatterURL: 'P3303',
			unitSymbol: 'P5061',
			urlMatchPattern: 'P8966',
			urlMatchReplacementValue: 'P8967', 
			websiteTitleExtractPattern: 'P10999', 
		},
		items: {
			allCaps: 'Q3960579', 
			caseInsensitive: 'Q55121183',
			lowercase: 'Q65048529',
			obsoleteProperty: 'Q18644427',
			propertyLinkingToArticlesInMediaWikiWebsites: 'Q123667996',
		},
		badResolvers: [
			'https://wikidata-externalid-url.toolforge.org/',
			'https://web.archive.org/web/',
			'https://resolve.eidr.org/',
		]
	},
	testWikidata: {
		name: 'Wikidata Test',
		color: 'black',
		instance: 'https://test.wikidata.org',
	},
	osmWiki: {
		name: 'OpenStreetMap Wiki',
		color: '#ded',
		instance: 'https://wiki.openstreetmap.org',
		sparqlEndpoint: 'https://sophox.org/sparql',
	}, 
	datatrek: {
		name: 'DataTrek',
		color: '#00a300',
		instance: 'https://data.wikitrek.org',
  		wgScriptPath: '/dt',
	},
	wikibaseWorld: {
		name: 'Wikibase World',
		color: '#394fa4',
		instance: 'https://wikibase.world',
		sparqlEndpoint: 'https://wikibase.world/query/sparql',
	},
	commons: {
		name: 'Wikimedia Commons',
		color: '#36c',
		instance: 'https://commons.wikimedia.org',
		sparqlEndpoint: 'https://wikibase.world/query/sparql',
	},
	playground: {
		name: 'Playground',
		color: '#f0d722',
		instance: 'https://playground.wikibase.cloud',
		sparqlEndpoint: 'https://playground.wikibase.cloud/query/sparql',
		props: {
			instanceOf: 'P1',
			urlMatchPattern: 'P26',
			urlMatchReplacementValue: 'P27', 
			formatterURL: 'P30',
			hasCharacteristic: 'P28',
			websiteTitleExtractPattern: 'P29', 
		},
		items: {
			allCaps: 'Q7', 
			lowercase: 'Q9',
			obsoleteProperty: 'Q8',
			caseInsensitive: 'Q10',
			propertyLinkingToArticlesInMediaWikiWebsites: 'Q11',
		}
	}
}

Object.keys(wikibases).forEach(name => {
	wikibases[name].id = name
	const wgScriptPath = wikibases[name]?.wgScriptPath ?? '/w'
	wikibases[name].api = WBK({
		instance: wikibases[name].instance,
		sparqlEndpoint: wikibases[name]?.sparqlEndpoint,
		wgScriptPath: wgScriptPath,
		wikiRoot: `${wikibases[name].instance}${wgScriptPath}`
	})
})

export default wikibases