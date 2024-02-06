import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'
import { isInViewport } from '../../modules/isInViewport.mjs'

export default async (element, api) => {
	isInViewport(element, () => {
		(async () => {
			const entity = await api.get(`wikidata:${element.dataset.id}`, ['labels', 'descriptions'])
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
		link.href = api.getLink(element.dataset.id)
		link.rel = 'preload'
		link.as = 'fetch'
		document.head.appendChild(link)
	}, '1000px')

}
