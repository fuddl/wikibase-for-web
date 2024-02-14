import { objectGetFirst } from '../../modules/objectGetFirst.mjs'
import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, context, manager }) => {
	const instance = manager.getInstance(context.instance)
	
	if (vars.globalID in manager.labelsAndDescrptionsCache) {
		const cached = manager.labelsAndDescrptionsCache[vars.globalID]
		vars.label = getByUserLanguage(cached.labels)
		const description = getByUserLanguage(cached.descriptions)
		vars.description = description?.value
	}

	const shortTitles = instance.queryCached('shortTitle', { subject: vars.id })
	const shortTitle = objectGetFirst(shortTitles)
	if ('value' in shortTitle) {
		vars.label = shortTitle
	}
}