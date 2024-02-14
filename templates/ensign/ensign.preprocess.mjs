import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, context, manager }) => {
	const instance = manager.getInstance(context.instance)

	vars.title = getByUserLanguage(vars.labels)
	vars.description = getByUserLanguage(vars.descriptions)
	vars.id = context.id
	vars.instancename = instance.name
}