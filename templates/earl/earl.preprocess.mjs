export default ({ vars }) => {
	vars.href = vars.value
	vars.short = vars.value
		.replace(/^[a-z]+\:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/index\.(php|html?)$/, '')
		.replace(/\/$/, '');
}