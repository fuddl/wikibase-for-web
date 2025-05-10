import { WBK } from './importmap/wikibase-sdk/dist/src/wikibase-sdk.js';
import wikidataSites from './wikidataSites.mjs';

async function fetchInterwikiMap(api) {
	// Construct the full API endpoint URL
	const endpoint = `${api}?action=query&format=json&meta=siteinfo&siprop=interwikimap`;

	try {
		const response = await fetch(endpoint);

		// Check if the response status is OK (status in the range 200-299)
		if (!response.ok) {
			throw new Error(
				`Network response was not ok: ${response.status} ${response.statusText}`,
			);
		}

		// Parse the JSON from the response
		const data = await response.json();

		// Log the data to the console (or handle it as needed)
		console.log('Interwiki Map:', data);

		// Optionally, return the data for further processing
		return data;
	} catch (error) {
		console.error('Error fetching interwiki map:', error);
	}
}

const wikibases = {
	wikidata: {
		name: 'Wikidata',
		//resolve: false,
		instance: 'https://www.wikidata.org',
		sparqlEndpoint: 'https://query.wikidata.org/sparql',
		autodesc: 'https://autodesc.toolforge.org',
		icon: browser.runtime.getURL('/icons/wikidata.svg'),
		props: {
			appliesIfRegularExpressionMatches: 'P8460',
			author: 'P50',
			autosuggestValue: 'P11889',
			auxiliaryVerb: 'P5401',
			class: 'P2308',
			conjugationClass: 'P5186',
			demonymOf: 'P6271',
			domainName: 'P13337',
			duration: 'P2047',
			equivalentClass: 'P1709',
			equivalentProperty: 'P1628',
			fieldOfUsage: 'P9488',
			fileFormat: 'P2701',
			formatterURL: 'P1630',
			grammaticalGender: 'P5185',
			hasCharacteristic: 'P1552',
			hyperonym: 'P6593',
			icon: 'P2910',
			image: 'P18',
			IETFLanguageTag: 'P305',
			instanceOf: 'P31',
			isbn10: 'P957',
			isbn13: 'P212',
			iso6391Code: 'P218',
			itemForThisSense: 'P5137',
			itemOfPropertyConstraint: 'P2305',
			languageOfWorkOrName: 'P407',
			languageStyle: 'P6191',
			location: 'P276',
			locationOfSenseUsage: 'P6084',
			mastodonAddress: 'P4033',
			mediaLegend: 'P2096',
			mediaWikiPageId: 'P9675',
			mobileFormatterURL: 'P7250',
			nameInKana: 'P1814',
			numberOfPages: 'P1104',
			numberOfReviewsRatings: 'P7887',
			occupation: 'P106',
			officialWebsite: 'P856',
			partOf: 'P361',
			partOfTheSeries: 'P179',
			pertainymOf: 'P8471',
			pointInTime: 'P585',
			predicateFor: 'P9970',
			propertiesForThisType: 'P1963',
			property: 'P2306',
			propertyConstraint: 'P2302',
			propertyExample: 'P1855',
			propertyExampleForForms: 'P5193',
			propertyExampleForLexemes: 'P5192',
			propertyExampleForMedia: 'P6685',
			propertyExampleForProperties: 'P2271',
			propertyScope: 'P5314',
			publicationDate: 'P577',
			referenceURL: 'P854',
			relation: 'P2309',
			retrieved: 'P813',
			reviewScore: 'P444',
			reviewScoreBy: 'P447',
			revisedHepburnRomanization: 'P2125',
			searchFormatterURL: 'P4354',
			sectionVerseParagraphOrClause: 'P958',
			semanticDerivationOf: 'P12410',
			semanticGender: 'P10339',
			seriesOrdinal: 'P1545',
			shortTitle: 'P1813',
			sourceWebsiteForTheProperty: 'P1896',
			subclassOf: 'P279',
			subjectNamedAs: 'P1810',
			subpropertyOf: 'P1647',
			thirdPartyFormatterURL: 'P3303',
			title: 'P1476',
			transitivity: 'P9295',
			translation: 'P5972',
			synonym: 'P5973',
			unitSymbol: 'P5061',
			url: 'P2699',
			urlMatchPattern: 'P8966',
			urlMatchReplacementValue: 'P8967',
			websiteTitleExtractPattern: 'P10999',
			wikimediaLanguageCode: 'P424',
		},
		items: {
			album: 'Q482994',
			allCaps: 'Q3960579',
			allowedEntityTypesConstraint: 'Q52004125',
			allowedUnitsConstraint: 'Q21514353',
			asMainValue: 'Q54828448',
			bigInteger: 'Q84314203',
			calendarMonth: 'Q47018901',
			caseInsensitive: 'Q55121183',
			day: 'Q573',
			dayOfAMonth: 'Q116600668',
			film: 'Q11424',
			gregorianCalendar: 'Q12138',
			hour: 'Q25235',
			human: 'Q5',
			instanceOf: 'Q21503252',
			instanceOrSubclassOf: 'Q30208840',
			itemRequiresStatementConstraint: 'Q21503247',
			JSON: 'Q2063',
			lexemeRequiresLanguageConstraint: 'Q55819106',
			literaryWork: 'Q7725634',
			lowercase: 'Q65048529',
			minute: 'Q7727',
			musicalWork: 'Q2188189',
			obsoleteProperty: 'Q18644427',
			playlist: 'Q1569406',
			propertyLinkingToArticlesInMediaWikiWebsites: 'Q123667996',
			propertyScopeConstraint: 'Q53869507',
			plural: 'Q146786',
			radioStation: 'Q14350',
			second: 'Q11574',
			singleValueConstraint: 'Q19474404',
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

			/* languages */
			english: 'Q1860',
			german: 'Q188',
			japanese: 'Q5287',

			/* lexical categories */
			adjective: 'Q34698',
			noun: 'Q1084',
			verb: 'Q24905',

			/* grammatical features */
			accusativeCase: 'Q146078',
			active: 'Q1317831',
			attributiveForm: 'Q53608953',
			affirmative: 'Q109267112',
			auxiliaryVerb: 'Q465800',
			case: 'Q128234',
			causativeForm: 'Q106781981',
			comparative: 'Q14169499',
			conjunctiveForm: 'Q2888577',
			dativeCase: 'Q145599',
			feminine: 'Q1775415',
			firstPerson: 'Q21714344', 
			genitiveCase: 'Q146233',
			grammaticalPerson: 'Q690940',
			grammaticalTense: 'Q177691',
			honorific: 'Q5897044',
			hypotheticalForm: 'Q53609593',
			imperative: 'Q22716',
			imperativeJa: 'Q4348304',
			imperfectiveForm: 'Q2898727',
			indicative: 'Q682111',
			infinitive: 'Q179230',
			linguisticForm: 'Q115786086',
			masculine: 'Q499327',
			negation: 'Q1478451',
			negativeForm: 'Q15737187',
			neuter: 'Q1775461',
			nominativeCase: 'Q131105',
			nonpastTense: 'Q16916993',
			passiveForm: 'Q106781962',
			pastTense: 'Q1994301',
			pastParticiple: 'Q12717679',
			pastParticipleEn: 'Q1230649',
			perfect: 'Q625420',
			plural: 'Q146786',
			positive: 'Q3482678',
			potential: 'Q11411856',
			predicative: 'Q1931259',
			presentParticiple: 'Q10345583',
			presentTense: 'Q192613',
			preterite: 'Q442485',
			secondPerson: 'Q51929049', 
			simplePast: 'Q1392475', 
			simplePresent: 'Q3910936',
			singular: 'Q110786',
			subjunctiveI: 'Q55685962',
			subjunctiveII: 'Q54671845',
			superlative: 'Q1817208',
			teForm: 'Q106781941',
			thirdPerson: 'Q51929074', 
			zuInfinitive: 'Q100952920',


			aColumnLowerOneRow: 'Q54072066',
			aColumnUpperOneRow: 'Q54064435',
			baColumnLowerOneRow: 'Q54072417',
			baColumnUpperOneRow: 'Q54064457',
			daColumnLowerOneRow: 'Q54072231',
			gaColumnLowerOneRow: 'Q54072108',
			gaColumnUpperOneRow: 'Q54064442',
			haColumnLowerOneRow: 'Q54072308',
			haColumnUpperOneRow: 'Q116448272',
			kaColumnLowerOneRow: 'Q54072093',
			kaColumnUpperOneRow: 'Q54064438',
			maColumnLowerOneRow: 'Q54072457',
			maColumnUpperOneRow: 'Q54064389',
			naColumnLowerOneRow: 'Q54072263',
			naColumnUpperOneRow: 'Q54064451',
			raColumnLowerOneRow: 'Q54072495',
			raColumnUpperOneRow: 'Q54064460',
			saColumnLowerOneRow: 'Q54072135',
			taColumnLowerOneRow: 'Q54072181',
			taColumnUpperOneRow: 'Q54064449',
			zaColumnLowerOneRow: 'Q54072150',
			zaColumnUpperOneRow: 'Q54064446',

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
		icon: browser.runtime.getURL('icons/commons.svg'),
		//sparqlEndpoint: 'https://commons-query.wikimedia.org/sparql',
	},
};

// Function to fetch manifest and update props and items for custom Wikibases
async function updateCustomWikibasesWithManifest(wikibase, wgScriptPath) {
	const manifestUrl = `${wikibase.instance}${wikibase.wgScriptPath ?? '/w'}/rest.php/wikibase-manifest/v0/manifest`;
	try {
		const response = await fetch(manifestUrl);
		if (response.ok) {
			const manifest = await response.json();
			const equivEntities = manifest?.equiv_entities?.['wikidata.org'];

			// Update props and items if equivalent entities are found
			if (equivEntities) {
				wikibase.props = {};
				wikibase.items = {};

				// Map Wikidata properties to custom Wikibase properties
				Object.entries(equivEntities.properties).forEach(
					([wikidataProp, customProp]) => {
						wikibase.props[
							getKeyByValue(wikibases.wikidata.props, wikidataProp)
						] = customProp;
					},
				);

				// Map Wikidata items to custom Wikibase items
				Object.entries(equivEntities.items).forEach(
					([wikidataItem, customItem]) => {
						wikibase.items[
							getKeyByValue(wikibases.wikidata.items, wikidataItem)
						] = customItem;
					},
				);
			}
		}
	} catch (error) {
		console.error(`Failed to fetch manifest for ${wikibase.name}:`, error);
	}
}

// Helper function to find the key for a specific value in an object
function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

try {
	// Get custom Wikibases from local storage
	const localData = await browser.storage.local.get('customWikibases');
	const customWikibases = localData.customWikibases || {};

	// Merge custom Wikibases and dynamically update their props and items using the manifest
	await Promise.all(
		Object.keys(customWikibases).map(async key => {
			await updateCustomWikibasesWithManifest(customWikibases[key]);
			wikibases[key] = customWikibases[key];
		}),
	);
} catch (error) {
	console.error('Error merging custom Wikibases:', error);
}

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
