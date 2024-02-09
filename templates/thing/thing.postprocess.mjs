import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'
import { isInViewport } from '../../modules/isInViewport.mjs'

export default async ({ element, manager }) => {
	if (!element?.dataset?.complete) {
		isInViewport(element, () => {
			(async () => {
				const entity = await manager.fetchLabelsAndDescrptions(element.dataset.id)
				const label = getByUserLanguage(entity.labels)
				element.innerText = label?.value ?? element.dataset.id
				if (label?.language) {
					element.lang = label.language
				}
				element.title = getByUserLanguage(entity.descriptions)?.value
			})()
		}, '500px')
		isInViewport(element, () => {
			const onScoll = () => {
				const link = document.createElement('link')
				link.href = manager.getEntityLink(element.dataset.id)
				link.rel = 'preload'
				link.as = 'fetch'
				document.head.appendChild(link)
				document.removeEventListener('scroll', onScoll)
			}
			document.addEventListener('scroll', onScoll)
		}, '1000px')
	}

}
