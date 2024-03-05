import { render } from './render.mjs';
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs';

const manager = new WikiBaseEntityManager({
	render: render,
	languages: navigator.languages,
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === 'resolved') {
		// extract all entities that have been matched so far
		const directMatches = message.candidates
			.filter(item => item?.resolved.length > 0)
			.map(item => item.resolved)
			.flat();

		const allEntities = directMatches.map(item => {
			return item.id;
		});

		if (directMatches) {
			manager.addEntities(allEntities);
		}

		const entitySpecificities = directMatches.map(item =>
			parseInt(item.specificity),
		);

		const propertySpecificities = message.candidates
			.filter(item => item.resolved.length === 0)
			.map(item => parseInt(item.specificity));

		const entityMaxSpecific = Math.max(...entitySpecificities);
		const propertyMaxSecific = Math.max(...propertySpecificities);

		const propertiesHigherSpecificity = message.candidates
			.filter(item => item.resolved.length === 0)
			.filter(item => item.specificity > entityMaxSpecific);

		const propertiesLowerSpecificity = message.candidates
			.filter(item => item.resolved.length === 0)
			.filter(item => item.specificity < entityMaxSpecific);

		const bestMatches = directMatches
			// only the most specific item
			.filter(item => item.specificity === entityMaxSpecific)
			// remove duplicates
			.filter((item, index, array) => array.indexOf(item) === index);

		manager.setMeta({
			betterProps: propertiesHigherSpecificity,
			otherMatches: directMatches.filter(
				item => item.specificity < entityMaxSpecific,
			),
			otherProps: propertiesLowerSpecificity,
		});

		const go = async () => {
			if (bestMatches.length > 0) {
				if (bestMatches.length < 2) {
					await manager.navigator.resetHistory({
						activity: 'view',
						id: bestMatches[0].id,
					});
				} else {
					await manager.navigator.resetHistory({
						activity: 'select',
						ids: bestMatches.map(item => item.id),
					});
				}
			} else if (message?.candidates?.length > 0) {
				await manager.navigator.resetHistory({
					activity: 'match',
					candidates: message.candidates,
				});
			}
		};
		await go();

		if (propertiesHigherSpecificity) {
			try {
				const { response } = await browser.runtime.sendMessage({
					type: 'request_metadata',
					url: propertiesHigherSpecificity[0].matchFromUrl,
				});
				if (
					response.lang &&
					response.title &&
					propertiesHigherSpecificity[0].titleExtractPattern
				) {
					propertiesHigherSpecificity[0].proposeEdits.push({
						action: 'wbsetaliases',
						add: new RegExp(
							propertiesHigherSpecificity[0].titleExtractPattern,
							'g',
						).exec(response.title)[1],
						language: response.lang,
					});
					console.debug(propertiesHigherSpecificity[0].proposeEdits);
					go();
				}
			} catch (error) {
				console.error('Error in sending message:', error);
			}
		}

		return Promise.resolve('done');
	} else if (message.type === 'update_entity') {
		manager.update(message.entity);
		return Promise.resolve('done');
	}
	return false;
});

try {
	await browser.runtime.sendMessage(browser.runtime.id, {
		type: 'request_entity',
	});
} catch (error) {
	console.error(error);
}
