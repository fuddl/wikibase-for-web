export default ({ vars, instance }) => {
	console.debug(vars.claims)
	if (instance?.propOrder?.length > 0) {
		vars.claims = instance.propOrder.reduce((acc, prop) => {
		if (vars.claims[prop]) {
			acc[prop] = vars.claims[prop];
		}
			return acc;
		}, {});
	}
}