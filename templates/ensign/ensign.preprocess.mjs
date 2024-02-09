import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, context }) => {
	vars.title = getByUserLanguage(vars.labels)
	vars.description = getByUserLanguage(vars.descriptions)
	vars.id = context.id
}