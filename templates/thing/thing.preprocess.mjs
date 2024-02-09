import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, context, instance, manager }) => {
	vars.globalId = vars.id ? `${instance.id}:${vars.id}` : vars.url ? manager.idFromEntityUrl(vars.url) : null
	vars.href = manager.urlFromGlobalId(vars.globalId)

	if (vars.globalId in manager.labelsAndDescrptionsCache) {
		const cached = manager.labelsAndDescrptionsCache[vars.globalId]
		vars.label = getByUserLanguage(cached.labels)
		const description = getByUserLanguage(cached.descriptions)
		vars.description = description?.value
	}
}