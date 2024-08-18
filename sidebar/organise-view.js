import wikibases from '../wikibases.mjs';

import { reconstructClaim } from '../types/Claim.mjs';

async function filterEditPermissions(unmatched, manager) {
	return (
		await Promise.all(
			unmatched.map(async item =>
				(await manager.hasEditPermissions(item.instance)) ? item : null,
			),
		)
	).filter(item => item !== null);
}

async function organiseView({ candidates }, manager) {
	for (const candidate of candidates) {
		if (!('proposeEdits' in candidate)) {
			continue;
		}
		for (const edit of candidate.proposeEdits) {
			if (!('claim' in edit)) {
				continue;
			}
			edit.claim = reconstructClaim(edit.claim);
		}
	}

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

	const matchable = await filterEditPermissions(unmatched, manager);

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
