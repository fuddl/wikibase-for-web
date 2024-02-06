import { sortByUserLanguages } from '../../modules/sortByUserLanguage.mjs'
import { objectGetFirst } from '../../modules/objectGetFirst.mjs'

export function getByUserLanguage (obj) {
	if (Object.keys(obj).length === 0) {
		return {}
	}
	const sortedObj = sortByUserLanguages(obj)

	return objectGetFirst(sortedObj)
}