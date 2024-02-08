export default (vars, context, instance) => {
	vars.datetime = vars.time.replace(/^(\+|\-)/, '')
	vars.time = vars.time.replace(/^(\+|\-)/, '')
	console.debug(vars.precision)
	if (vars.precision > 10) {
		const date = new Date(vars.datetime)
		vars.localised = date.toLocaleDateString()
	}
	vars.calendar = {
		id: vars.calendarmodel.split(/(\w\d+)$/)[1]
	}
}