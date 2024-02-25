import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';
import { isInViewport } from '../../modules/isInViewport.mjs';

export default async ({ element, manager, addEvents }) => {
	if (!element?.dataset?.complete) {
		isInViewport(
			element,
			() => {
				(async () => {
					const entity = await manager.fetchLabelsAndDescrptions(
						element.dataset.id,
					);
					const label = getByUserLanguage(entity.labels);
					element.innerText = label?.value ?? element.dataset.id;
					if (label?.language) {
						element.lang = label.language;
					}
					element.title = getByUserLanguage(entity.descriptions)?.value;
				})();
			},
			'500px',
		);
	}
};
