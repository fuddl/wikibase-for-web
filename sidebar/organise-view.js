function organiseView({ candidates }) {
	const directMatches = candidates
		.filter(item => item?.resolved.length > 0)
		.map(item => item.resolved)
		.flat();

	const allEntities = directMatches.map(item => {
		return item.id;
	});

	const entitySpecificities = directMatches.map(item =>
		parseInt(item.specificity),
	);

	const propertySpecificities = candidates
		.filter(item => item.resolved.length === 0)
		.map(item => parseInt(item.specificity));

	const entityMaxSpecific = Math.max(...entitySpecificities);
	const propertyMaxSecific = Math.max(...propertySpecificities);

	const propertiesHigherSpecificity = candidates
		.filter(item => item.resolved.length === 0)
		.filter(item => item.specificity > entityMaxSpecific);

	const propertiesLowerSpecificity = candidates
		.filter(item => item.resolved.length === 0)
		.filter(item => item.specificity < entityMaxSpecific);

	const bestMatches = directMatches
		// only the most specific item
		.filter(item => item.specificity === entityMaxSpecific)
		// remove duplicates
		.filter((item, index, array) => array.indexOf(item) === index);

	return {
		bestMatches: bestMatches,
		otherMatches: directMatches.filter(
			item => item.specificity < entityMaxSpecific,
		),
		betterProps: propertiesHigherSpecificity,
		otherProps: propertiesLowerSpecificity,
	};
}

export { organiseView };
