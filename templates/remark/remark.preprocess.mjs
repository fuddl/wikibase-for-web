export default ({ vars }) => {
	vars.objects = []
	for (const object of vars) {
		vars.objects.push(object)
	}
	vars.verb = vars[0].mainsnak.property

	vars.unknown = browser.i18n.getMessage('unknown')
	vars.noValue = browser.i18n.getMessage('no_value')
}