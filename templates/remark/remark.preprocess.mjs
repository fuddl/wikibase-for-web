export default ({ vars }) => {
	vars.objects = [];
	for (const object of vars) {
		vars.objects.push(object);
	}
	vars.verb = vars[0].mainsnak.propertyGlobalID;
};
