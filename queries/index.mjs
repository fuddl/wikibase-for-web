import { calendarVocabulary } from './calendarVocabulary.mjs';
import { equivalentClasses } from './equivalentClasses.mjs';
import { equivalentProperties } from './equivalentProperties.mjs';
import { expectedIdsByLanguage } from './expectedIdsByLanguage.mjs';
import { expectedIdsByType } from './expectedIdsByType.mjs';
import { inheritedClasses } from './inheritedClasses.mjs';
import { instancesOrSubclasses } from './instancesOrSubclasses.mjs';
import { inferredSenses } from './inferredSenses.mjs';
import { itemByExternalId } from './itemByExternalId.mjs';
import { itemByUrl } from './itemByUrl.mjs';
import { labels } from './labels.mjs';
import { languageByIETF } from './languageByIETF.mjs';
import { languageByIso6391Code } from './languageByIso6391Code.mjs';
import { propertyIcons } from './propertyIcons.mjs';
import { randomLemmaByLang } from './randomLemmaByLang.mjs';
import { reviewScoreHostnames } from './reviewScoreHostnames.mjs';
import { shortTitle } from './shortTitle.mjs';
import { unitSymbol } from './unitSymbol.mjs';
import { urlMatchPattern } from './urlMatchPattern.mjs';
import { urlProperties } from './urlProperties.mjs';

const queries = {
	calendarVocabulary,
	equivalentClasses,
	equivalentProperties,
	expectedIdsByLanguage,
	expectedIdsByType,
	inheritedClasses,
	instancesOrSubclasses,
	inferredSenses,
	itemByExternalId,
	itemByUrl,
	labels,
	languageByIETF,
	languageByIso6391Code,
	propertyIcons,
	randomLemmaByLang,
	reviewScoreHostnames,
	shortTitle,
	unitSymbol,
	urlMatchPattern,
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

	async query(instance, queryObject, params) {
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

		const query = queryObject.query({ params, instance });
		const queryUrl = instance.api.sparqlQuery(query);

		const startTime = performance.now();
		const queryResult = await fetch(queryUrl).then(res => res.json());
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
