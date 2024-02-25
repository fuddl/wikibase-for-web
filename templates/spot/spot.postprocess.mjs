import { isInViewport } from '../../modules/isInViewport.mjs';
import { objectGetFirst } from '../../modules/objectGetFirst.mjs';
import { filterBadClaims } from '../../modules/filterBadValues.mjs';

export default async ({ element, instance }) => {
	const formatterURLProp = instance?.props?.formatterURL;
	if (formatterURLProp) {
		const codeElement = element.querySelector('.spot__code');
		isInViewport(element, async () => {
			const urls = [];
			const propEntityUrl = instance.api.getEntities({
				ids: element.dataset.property,
				languages: [],
				props: ['claims'],
			});
			const { entities } = await fetch(propEntityUrl).then(res => res.json());
			const propEntity = objectGetFirst(entities);
			if (formatterURLProp in propEntity.claims) {
				filterBadClaims([propEntity.claims[formatterURLProp]])[0].forEach(
					formatterUrlStatement => {
						const value = formatterUrlStatement?.mainsnak?.datavalue?.value;
						if (value) {
							urls.push(value.replace('$1', element.dataset.value));
						}
					},
				);
			}
			if (urls.length > 0) {
				codeElement.hidden = true;
				const link = document.createElement('a');
				link.classList.add('spot__link');
				link.href = urls[0];
				link.innerText = element.dataset.value;
				codeElement.parentNode.insertBefore(link, codeElement);
			}
		});
	}
};
