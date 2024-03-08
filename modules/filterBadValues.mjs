/**
 * Filters out deprecated values from claims and retains preferred values over normal ones if both exist.
 * @param {Array} claims - An array of claim sets to be processed.
 * @returns {Array} - The processed array of claim sets, with bad values filtered out.
 */
export function filterBadClaims(claims) {
	return claims
		.map(claim => {
			const preferredExists = claim.some(
				statement => statement.rank === 'preferred',
			);

			return claim.filter(statement => {
				// Keep statement if it's preferred or if no preferred exists and it's normal, always remove deprecated
				return (
					statement.rank !== 'deprecated' &&
					(!preferredExists || statement.rank === 'preferred')
				);
			});
		})
		.filter(item => item.length > 0);
}
