export default (vars, context) => {
	vars.objects = []
	for (const object of vars) {
		vars.objects.push(object)
	}
	vars.verb = vars[0].mainsnak.property
}