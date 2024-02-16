import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs'

export default ({ vars, manager }) => {
	const options = []
	for (const item of vars) {
		if (item.selectable) {
			options.push({
				globalID: item.data.globalID,
				instance: item.data.instance,
				label: getByUserLanguage(item.data.labels),
				description: getByUserLanguage(item.data.descriptions),
				url: manager.urlFromGlobalId(item.data.globalID),
			})
		}
	}
	vars.options = options
	vars.intro = browser.i18n.getMessage('ambiguous_url_intro')
	vars.title = browser.i18n.getMessage('ambiguous_url_title')
}