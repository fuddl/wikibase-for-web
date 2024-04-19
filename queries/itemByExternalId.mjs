export const itemByExternalId = {
	id: 'item-by-external-id',
	query: ({ instance, params }) => `
		SELECT ?item WHERE {
			?item wdt:${params.property} ${params.case == 'insensitive' ? '?id' : `"${params.id.replace(/"/g, '\\"')}"`}.
			${params.case == 'insensitive' ? `filter(lcase(?id) = "${params.id}")` : ''}
		}

	`,
	cacheTag: ({ instance, params }) =>
		`external-id:${params.id}:${params.property}:${params.case}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push(bind.item.value.match(/\w\d+$/)[0]);
		});
		return processed;
	},
};
