import { objectGetFirst } from '../../modules/objectGetFirst.mjs';
import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';
import { isInViewport } from '../../modules/isInViewport.mjs';

export default async ({ element, instance, manager, addEvents }) => {
	if (!element?.dataset?.complete) {
		isInViewport(element, async () => {
			const units = await instance.query('unitSymbol', {
				subject: element.dataset.id.split(':')[1],
			});
			const unit = objectGetFirst(units);
			const entity = await manager.fetchLabelsAndDescrptions(
				element.dataset.id,
			);

			if ('value' in unit) {
				element.innerText = unit.value;
				element.lang = unit.language;
			} else {
				const label = getByUserLanguage(entity.labels);
				element.innerText = label?.value ?? element.dataset.id;
				if (label?.language) {
					element.lang = label.language;
				}
				element.title = getByUserLanguage(entity.descriptions)?.value;
			}
		});
	}
	if (addEvents) {
		element.addEventListener('click', async e => {
			e.preventDefault();
			manager.navigator.navigate({
				activity: 'view',
				id: element.dataset.id,
			});
		});
	}
};
