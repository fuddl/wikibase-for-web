import { calendarVocabulary } from './calendarVocabulary.mjs';
import { equivalentClasses } from './equivalentClasses.mjs';
import { equivalentProperties } from './equivalentProperties.mjs';
import { expectedIdsByLanguage } from './expectedIdsByLanguage.mjs';
import { expectedIdsByType } from './expectedIdsByType.mjs';
import { hyperonyms } from './hyperonyms.mjs';
import { inferredSenses } from './inferredSenses.mjs';
import { inheritedClasses } from './inheritedClasses.mjs';
import { instancesOrSubclasses } from './instancesOrSubclasses.mjs';
import { itemByDomain } from './itemByDomain.mjs';
import { itemByExternalId } from './itemByExternalId.mjs';
import { itemByUrl } from './itemByUrl.mjs';
import { labels } from './labels.mjs';
import { languageByIETF } from './languageByIETF.mjs';
import { languageByIso6391Code } from './languageByIso6391Code.mjs';
import { parentGeoRegions } from './parentGeoRegions.mjs';
import { propertyIcons } from './propertyIcons.mjs';
import { randomLemmaByLang } from './randomLemmaByLang.mjs';
import { reviewScoreHostnames } from './reviewScoreHostnames.mjs';
import { shortTitle } from './shortTitle.mjs';
import { unitSymbol } from './unitSymbol.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { urlMatchPatternByDomain } from './urlMatchPatternByDomain.mjs';
import { urlProperties } from './urlProperties.mjs';
import { propertyByFormatterUrl } from './propertyByFormatterUrl.mjs';
import { fetchJSON } from '../modules/fetch.mjs';

const queries = {
	calendarVocabulary,
	equivalentClasses,
	equivalentProperties,
	expectedIdsByLanguage,
	expectedIdsByType,
	hyperonyms,
	inferredSenses,
	inheritedClasses,
	instancesOrSubclasses,
	itemByDomain,
	itemByExternalId,
	itemByUrl,
	labels,
	languageByIETF,
	languageByIso6391Code,
	parentGeoRegions,
	propertyByFormatterUrl,
	propertyIcons,
	randomLemmaByLang,
	reviewScoreHostnames,
	shortTitle,
	unitSymbol,
	urlMatchPattern,
	urlMatchPatternByDomain,
	urlProperties,
};

class WikiBaseQueryManager {
	constructor(params) {
		this.cache = {};
		this.queries = queries;
	}


	queryCached(instance, queryObject, params) {
		if (
			queryObject?.requiredProps &&
			!this.checkRequiredProps(instance, queryObject.requiredProps) &&
			queryObject?.requiredItems &&
			!this.checkRequiredItems(instance, queryObject.requiredItems)
		) {
			return [];
		}

		const queryCacheTag = `${instance.id}:${queryObject.cacheTag({ params, instance })}`;

		if (!('sparqlEndpoint' in instance)) {
			this.cache[queryCacheTag] = [];
			return [];
		}

		// if its already cached, return cache
		if (queryCacheTag in this.cache) {
			return this.cache[queryCacheTag];
		} else {
			return false;
		}
	}

	async query(instance, queryObject, params, signal) {
		if (
			queryObject?.requiredProps &&
			!this.checkRequiredProps(instance, queryObject.requiredProps) &&
			queryObject?.requiredItems &&
			!this.checkRequiredItems(instance, queryObject.requiredItems)
		) {
			return [];
		}

		const queryCacheTag = `${instance.id}:${queryObject.cacheTag({ params, instance })}`;

		const cached = this.queryCached(instance, queryObject, params);
		if (cached) {
			return cached;
		}

		if (!('sparqlEndpoint' in instance)) {
			this.cache[queryCacheTag] = [];
			return [];
		}

		const prefixes = []
		if (instance?.rdf_namespaces) {
			for (const [rdfKey, sparqlPrefix] of Object.entries(instance.rdf_namespaces)) {
				const iri = instance.rdf_namespaces?.[rdfKey];
				if (!iri) continue;
				if (!rdfKey) continue;
				prefixes.push(`PREFIX ${rdfKey}: <${iri}>`);
			}
		}

		const query = `${prefixes.join("\n")}\n${queryObject.query({ params, instance })}`;
		const queryUrl = instance.api.sparqlQuery(query);

		const startTime = performance.now();
		const queryResult = await fetchJSON(queryUrl, { signal });
		const endTime = performance.now();
		//console.debug(`Query: ${queryObject.id} | ${endTime - startTime}ms`);

		const processedResult = queryObject?.postProcess
			? queryObject.postProcess(queryResult, params, instance)
			: queryResult;
		this.cache[queryCacheTag] = processedResult;

		return processedResult;
	}

	checkRequiredProps(instance, requirements) {
		return requirements.every(
			requirement => requirement in (instance?.props ?? {}),
		);
	}
	checkRequiredItems(instance, requirements) {
		return requirements.every(
			requirement => requirement in (instance?.items ?? {}),
		);
	}
}

export default WikiBaseQueryManager;
