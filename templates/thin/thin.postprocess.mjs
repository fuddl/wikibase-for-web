import { objectGetFirst } from '../../modules/objectGetFirst.mjs'
import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'
import { isInViewport } from '../../modules/isInViewport.mjs'

export default async ({ element, manager, instance, addEvents }) => {
	if (!element?.dataset?.complete) {
		isInViewport(element, async () => {
			const shortTitles = await instance.query('shortTitle', { subject: element.dataset.id.split(':')[1] })
			const shortTitle = objectGetFirst(shortTitles)
			const entity = await manager.fetchLabelsAndDescrptions(element.dataset.id)
			
			if ('value' in shortTitle) {
				element.innerText = shortTitle.value
				element.lang = shortTitle.language
			} else {
				const label = getByUserLanguage(entity.labels)
				element.innerText = label?.value ?? element.dataset.id
				if (label?.language) {
					element.lang = label.language
				}
				element.title = getByUserLanguage(entity.descriptions)?.value
			}
		})
	}
	if (addEvents) {
		element.addEventListener('click', async (e) => {
			e.preventDefault()
			await manager.addAndActivate(element.dataset.id)
		})
	}
}
