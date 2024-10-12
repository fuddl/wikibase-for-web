import { WBK } from './importmap/wikibase-sdk/dist/src/wikibase-sdk.js';
import wikidataSites from './wikidataSites.mjs';

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
			class: 'P2308',
			duration: 'P2047',
			equivalentClass: 'P1709',
			equivalentProperty: 'P1628',
			formatterURL: 'P1630',
			hasCharacteristic: 'P1552',
			instanceOf: 'P31',
			isbn10: 'P957',
			isbn13: 'P212',
			iso6391Code: 'P218',
			itemForThisSense: 'P5137',
			itemOfPropertyConstraint: 'P2305',
			languageOfWorkOrName: 'P407',
			location: 'P276',
			mastodonAddress: 'P4033',
			mobileFormatterURL: 'P7250',
			nameInKana: 'P1814',
			numberOfPages: 'P1104',
			numberOfReviewsRatings: 'P7887',
			mediaWikiPageId: 'P9675',
			occupation: 'P106',
			officialWebsite: 'P856',
			partOfTheSeries: 'P179',
			pointInTime: 'P585',
			property: 'P2306',
			propertyConstraint: 'P2302',
			propertyScope: 'P5314',
			propertiesForThisType: 'P1963',
			publicationDate: 'P577',
			referenceURL: 'P854',
			relation: 'P2309',
			retrieved: 'P813',
			reviewScore: 'P444',
			reviewScoreBy: 'P447',
			revisedHepburnRomanization: 'P2125',
			searchFormatterURL: 'P4354',
			sectionVerseParagraphOrClause: 'P958',
			shortTitle: 'P1813',
			sourceWebsiteForTheProperty: 'P1896',
			subclassOf: 'P279',
			subjectNamedAs: 'P1810',
			subpropertyOf: 'P1647',
			thirdPartyFormatterURL: 'P3303',
			title: 'P1476',
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
