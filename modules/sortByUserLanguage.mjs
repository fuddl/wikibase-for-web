export const sortByUserLanguages = object => {
	// Normalize user languages to match the entries object keys
	const normalizedUserLanguages = [...new Set([
		...navigator.languages,
		...navigator.languages.map(
			lang => lang.split('-')[0],
		),
	].map(
		lang => lang.toLowerCase(),
	))]

	// make sure 'default for all languages' is selected as a fallback
	if (!normalizedUserLanguages.includes('mul')) {
		normalizedUserLanguages.push('mul');
	}

	// Sort entries according to userLanguages
	const sortedObject = Object.keys(object)
		.sort((a, b) => {
			let indexA = normalizedUserLanguages.indexOf(a);
			let indexB = normalizedUserLanguages.indexOf(b);

			// If one of the languages is not in the user's preferences, it will go to the end
			if (indexA === -1) indexA = Number.MAX_VALUE;
			if (indexB === -1) indexB = Number.MAX_VALUE;

			return indexA - indexB;
		})
		.reduce((acc, key) => {
			if (typeof object[key] === 'object') {
				object[key].preferred = normalizedUserLanguages.includes(key);
			}
			acc[key] = object[key];
			return acc;
		}, {});

	return sortedObject;
};
