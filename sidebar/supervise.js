import { render } from './render.mjs';
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs';

const manager = new WikiBaseEntityManager({
	render: render,
	languages: navigator.languages,
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === 'resolved') {
		// extract all entities that have been matched so far
		const directMatches = message.candidates.filter(item => {
			return item?.resolved.length > 0;
		});

		const allEntities = directMatches
			.map(item => {
				return item.resolved.map(item => item.id);
			})
			.flat();

		if (directMatches) {
			manager.addEntities(allEntities);
		}

		const specificities = directMatches.map(item => parseInt(item.specificity));
		const maxSpecific = Math.max(...specificities);

		const unmatchedHigherSpecificity = message.candidates.filter(
			item => item.specificity > maxSpecific,
		);

		const unmatchedLowerSpecificity = message.candidates.filter(
			item => item.specificity < maxSpecific,
		);

		const bestMatches = directMatches
			.filter(item => item.specificity === maxSpecific)
			.map(item => {
				return item.resolved.map(item => item.id);
			})
			.flat();

		manager.setMeta({
			betterProps: unmatchedHigherSpecificity,
			otherMatches: directMatches,
			otherProps: unmatchedLowerSpecificity,
		});

		if (bestMatches.length > 0) {
			if (bestMatches.length < 2) {
				await manager.navigator.resetHistory({
					activity: 'view',
					id: bestMatches[0],
				});
			} else {
				await manager.navigator.resetHistory({
					activity: 'select',
					ids: bestMatches,
				});
			}
		}

		if (message?.candidates?.length > 0) {
			await manager.navigator.resetHistory({
				activity: 'match',
				candidates: message.candidates,
			});
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
