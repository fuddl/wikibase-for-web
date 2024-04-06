import wikibases from '../wikibases.mjs';

async function filterEditPermissions(unmatched) {
	return (
		await Promise.all(
			unmatched.map(
				item =>
					new Promise(async (resolve, reject) => {
						const endpoint = wikibases[item.instance].api.instance.apiEndpoint;

						try {
							const response = await fetch(
								`${endpoint}?action=query&meta=userinfo&uiprop=rights&format=json`,
							);
							if (!response.ok) {
								resolve(null);
							}

							const data = await response.json();
							const rights = data.query.userinfo.rights;

							const hasPermissions =
								rights.includes('writeapi') && rights.includes('edit');
							resolve(hasPermissions ? item : null);
						} catch (error) {
							reject(error);
						}
					}),
			),
		)
	).filter(item => item !== null);
}

async function organiseView({ candidates }) {
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

	const unmatched = candidates.filter(item => item.resolved.length === 0);

	const matchable = await filterEditPermissions(unmatched);

	const propertySpecificities = matchable.map(item =>
		parseInt(item.specificity),
	);

	const entityMaxSpecific = Math.max(...entitySpecificities);
	const propertyMaxSecific = Math.max(...propertySpecificities);

	const propertiesHigherSpecificity = matchable.filter(
		item => item.specificity > entityMaxSpecific,
	);

	const propertiesLowerSpecificity = matchable.filter(
		item => item.specificity < entityMaxSpecific,
	);

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
