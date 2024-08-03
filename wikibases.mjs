import { WBK } from './importmap/wikibase-sdk/dist/src/wikibase-sdk.js';
import wikidataSites from './wikidataSites.mjs';

const wikibases = {
	wikidata: {
		name: 'Wikidata',
		//resolve: false,
		instance: 'https://www.wikidata.org',
		sparqlEndpoint: 'https://query.wikidata.org/sparql',
		autodesc: 'https://autodesc.toolforge.org',
		icon: 'icons/wikidata.svg',
		props: {
			appliesIfRegularExpressionMatches: 'P8460',
			author: 'P50',
			class: 'P2308',
			duration: 'P2047',
			equivalentClass: 'P1709',
			equivalentProperty: 'P1628',
			formatterURL: 'P1630',
			hasCharacteristic: 'P1552',
			instanceOf: 'P31',
			isbn10: 'P957',
			isbn13: 'P212',
			itemOfPropertyConstraint: 'P2305',
			location: 'P276',
			mastodonAddress: 'P4033',
			mobileFormatterURL: 'P7250',
			nameInKana: 'P1814',
			numberOfPages: 'P1104',
			numberOfReviewsRatings: 'P7887',
			occupation: 'P106',
			officialWebsite: 'P856',
			partOfTheSeries: 'P179',
			pointInTime: 'P585',
			property: 'P2306',
			propertyConstraint: 'P2302',
			propertyScope: 'P5314',
			publicationDate: 'P577',
			referenceURL: 'P854',
			relation: 'P2309',
			retrieved: 'P813',
			reviewScore: 'P444',
			reviewScoreBy: 'P447',
			revisedHepburnRomanization: 'P2125',
			shortTitle: 'P1813',
			subclassOf: 'P279',
			subpropertyOf: 'P1647',
			thirdPartyFormatterURL: 'P3303',
			title: 'P1476',
			unitSymbol: 'P5061',
			urlMatchPattern: 'P8966',
			urlMatchReplacementValue: 'P8967',
			websiteTitleExtractPattern: 'P10999',
		},
		items: {
			album: 'Q482994',
			allCaps: 'Q3960579',
			allowedEntityTypesConstraint: 'Q52004125',
			asMainValue: 'Q54828448',
			bigInteger: 'Q84314203',
			caseInsensitive: 'Q55121183',
			day: 'Q573',
			film: 'Q11424',
			hour: 'Q25235',
			human: 'Q5',
			instanceOf: 'Q21503252',
			instanceOrSubclassOf: 'Q30208840',
			itemRequiresStatementConstraint: 'Q21503247',
			literaryWork: 'Q7725634',
			lowercase: 'Q65048529',
			minute: 'Q7727',
			musicalWork: 'Q2188189',
			obsoleteProperty: 'Q18644427',
			playlist: 'Q1569406',
			propertyLinkingToArticlesInMediaWikiWebsites: 'Q123667996',
			propertyScopeConstraint: 'Q53869507',
			radioStation: 'Q14350',
			second: 'Q11574',
			subjectTypeConstraint: 'Q21503250',
			televisionSeries: 'Q5398426',
			televisionSeriesEpisode: 'Q21191270',
			userReview: 'Q20058247',
			versionEditionOrTranslation: 'Q3331189',
			week: 'Q23387',
			wikibaseItem: 'Q29934200',
			wikibaseLexeme: 'Q51885771',
			wikibaseSense: 'Q54285715',
			writer: 'Q36180',
			year: 'Q577',
		},
		sites: wikidataSites,
		badResolvers: [
			'https://wikidata-externalid-url.toolforge.org/',
			'https://web.archive.org/web/',
			'https://resolve.eidr.org/',
		],
	},
	commons: {
		name: 'Wikimedia Commons',
		instance: 'https://commons.wikimedia.org',
		resolve: false,
		//sparqlEndpoint: 'https://commons-query.wikimedia.org/sparql',
	},

	// an instance for testing
	//
	// playground: {
	// 	name: 'Playground',
	// 	instance: 'https://playground.wikibase.cloud',
	// 	sparqlEndpoint: 'https://playground.wikibase.cloud/query/sparql',
	// 	props: {
	// 		author: 'P46',
	// 		duration: 'P44',
	// 		equivalentClass: 'P52',
	// 		equivalentProperty: 'P53',
	// 		formatterURL: 'P30',
	// 		hasCharacteristic: 'P28',
	// 		instanceOf: 'P1',
	// 		isbn10: 'P48',
	// 		isbn13: 'P49',
	// 		location: 'P39',
	// 		numberOfPages: 'P47',
	// 		numberOfReviewsRatings: 'P56',
	// 		occupation: 'P43',
	// 		partOfTheSeries: 'P45',
	// 		pointInTime: 'P57',
	// 		publicationDate: 'P51',
	// 		referenceURL: 'P31',
	// 		retrieved: 'P54',
	// 		reviewScore: 'P55',
	// 		shortTitle: 'P37',
	// 		title: 'P42',
	// 		unitSymbol: 'P38',
	// 		urlMatchPattern: 'P26',
	// 		urlMatchReplacementValue: 'P27',
	// 		websiteTitleExtractPattern: 'P29',
	// 	},
	// 	items: {
	// 		allCaps: 'Q7',
	// 		caseInsensitive: 'Q10',
	// 		edition: 'Q20',
	// 		film: 'Q22',
	// 		lowercase: 'Q9',
	// 		minute: 'Q24',
	// 		obsoleteProperty: 'Q8',
	// 		propertyLinkingToArticlesInMediaWikiWebsites: 'Q11',
	// 		second: 'Q23',
	// 		userReview: 'Q52',
	// 		writer: 'Q21',
	// 	},
	// },
};

Object.keys(wikibases).forEach(name => {
	wikibases[name].id = name;
	const wgScriptPath = wikibases[name]?.wgScriptPath ?? '/w';
	wikibases[name].api = WBK({
		instance: wikibases[name].instance,
		sparqlEndpoint: wikibases[name]?.sparqlEndpoint,
		wgScriptPath: wgScriptPath,
		wikiRoot: `${wikibases[name].instance}${wgScriptPath}`,
	});
});

export default wikibases;
