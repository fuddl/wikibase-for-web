import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';

export default async ({ element, manager }) => {
	const actions = element.querySelectorAll('.actions__action');
	actions.forEach(async action => {
		if (action.dataset.postProcess == 'getLabelsAndDescriptions') {
			const lad = await manager.fetchLabelsAndDescrptions(action.dataset.id);
			action.querySelector('.actions__title').innerText = getByUserLanguage(
				lad.labels,
			).value;
			action.querySelector('.actions__desc').innerText = getByUserLanguage(
				lad.descriptions,
			).value;
		}
	});
};
