export default ({ vars }) => {
	vars.datetime = vars.time.replace(/^(\+|\-)/, '')
	vars.time = vars.time.replace(/^(\+|\-)/, '')
	if (vars.precision > 10) {
		const date = new Date(vars.datetime)
		vars.localised = date.toLocaleDateString()
	}
	vars.calendar = {
		id: vars.calendarmodel.split(/(\w\d+)$/)[1]
	}
}