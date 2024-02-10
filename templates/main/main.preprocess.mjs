export default ({ vars, instance }) => {
	
	// sort claims by /MediaWiki:Wikibase-SortedProperties
	if (instance?.propOrder?.length > 0) {
		vars.claims = instance.propOrder.reduce((acc, prop) => {
		if (vars.claims[prop]) {
			acc[prop] = vars.claims[prop];
		}
			return acc;
		}, {});
	}
}