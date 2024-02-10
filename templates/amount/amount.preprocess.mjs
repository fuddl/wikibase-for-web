export default ({ vars }) => {
	vars.number = new Intl.NumberFormat().format(parseFloat(vars.amount))
}