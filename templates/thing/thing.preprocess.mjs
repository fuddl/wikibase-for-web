import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, instance}) => {
	if (vars.id in instance.labelsAndDescrptionsCache) {
		const cached = instance.labelsAndDescrptionsCache[vars.id]
		vars.label = getByUserLanguage(cached.labels)
		const description = getByUserLanguage(cached.descriptions)
		vars.description = description?.value
	}
}