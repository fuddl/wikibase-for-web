import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, context, manager }) => {
	const instance = manager.getInstance(context.instance)

	//vars.href = manager.urlFromGlobalId(vars.globalID)

	if (vars.globalID in manager.labelsAndDescrptionsCache) {
		const cached = manager.labelsAndDescrptionsCache[vars.globalID]
		vars.label = getByUserLanguage(cached.labels)
		const description = getByUserLanguage(cached.descriptions)
		vars.description = description?.value
	}
}