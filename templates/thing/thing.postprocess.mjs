import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'
import { isInViewport } from '../../modules/isInViewport.mjs'

export default async (element, manager) => {
	isInViewport(element, () => {
		(async () => {
			const entity = await manager.fetchEntity(element.dataset.id, ['labels', 'descriptions'])
			const label = getByUserLanguage(entity.labels)
			element.innerText = label?.value ?? element.dataset.id
			if (label?.language) {
				element.lang = label.language
			}
			element.title = getByUserLanguage(entity.descriptions)?.value
		})()
	}, '500px')
	isInViewport(element, () => {
		const link = document.createElement('link')
		link.href = manager.getEntityLink(element.dataset.id)
		link.rel = 'preload'
		link.as = 'fetch'
		document.head.appendChild(link)
	}, '1000px')

}
