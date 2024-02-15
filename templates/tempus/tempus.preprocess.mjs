export default ({ vars }) => {
	vars.datetime = vars.time.replace(/^(\+|\-)/, '')
	const negative = vars.time.startsWith('-')

	if (vars.precision > 10) {
		const date = new Date(vars.datetime)
		vars.localised = date.toLocaleDateString()
	} else if (vars.precision == 10) {
		const year = parseInt(vars.time.substring(1,6))
		const monthNumber = parseInt(vars.time.substring(6,8))
		const date = new Date(vars.datetime)
		const monthNames = [
			browser.i18n.getMessage('month_1'),
			browser.i18n.getMessage('month_2'),
			browser.i18n.getMessage('month_3'),
			browser.i18n.getMessage('month_4'),
			browser.i18n.getMessage('month_5'),
			browser.i18n.getMessage('month_6'),
			browser.i18n.getMessage('month_7'),
			browser.i18n.getMessage('month_8'),
			browser.i18n.getMessage('month_9'),
			browser.i18n.getMessage('month_10'),
			browser.i18n.getMessage('month_11'),
			browser.i18n.getMessage('month_12'),
		]
		const monthName = monthNames[monthNumber + 1];
		vars.localised = browser.i18n.getMessage("date_month", [monthName, monthNumber, year])
	} else if (vars.precision == 9) {
		const year = parseInt(vars.time.substring(1,6))
		vars.localised = browser.i18n.getMessage("date_year", [year])
	} else if (vars.precision == 8) {
		const decade = `${parseInt(vars.time.substring(1,4))}`.padEnd(4, '0')
		const decadeOrdinal = `${parseInt(decade) + 10}`.slice(0, -1)
		vars.localised = browser.i18n.getMessage("date_decade", [decadeOrdinal, decade])
	} else if (vars.precision == 7) {
		const century = parseInt(vars.time.substring(1,3))
		const centuryOrdinal = century + 1
		vars.localised = browser.i18n.getMessage("date_cenury", [centuryOrdinal, century])
	} else if (vars.precision == 6) {
		const millenia = parseInt(vars.time.substring(1,2))
		const milleniaOrdinal = millenia + 1
		vars.localised = browser.i18n.getMessage("date_millenium", [milleniaOrdinal, millenia])
	} else if (vars.precision < 6) {
		const year = parseInt(vars.time.substring(1,6))
		const deltas = {
			'5': 10000,
			'4': 100000,
			'3': 1000000,
			'2': 10000000,
			'1': 100000000,
		}
		const delta = deltas[vars.precision]
		const lowerBound = year - (delta / 2)
		const upperBound = year + (delta / 2)
		const deltaFormated = new Intl.NumberFormat().format(parseFloat((delta / 2)))
		vars.localised = browser.i18n.getMessage("date_year_range", [year, lowerBound, upperBound, deltaFormated])
	}
	if (negative && vars.precision > 5) {
		vars.localised = browser.i18n.getMessage("date_bce", [vars.localised])
	}

	vars.calendar = {
		url: vars.calendarmodel
	}
}