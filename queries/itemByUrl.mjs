export const itemByUrl = {
	id: 'item-by-url',
	query: ({ instance, params }) => `
		SELECT ?url ?item WHERE {
			VALUES ?url {
				${params.urls.map(url => `<${url}>`).join(' ')}
			}
			?item ?predicate ?url.
			?property wikibase:directClaim ?predicate.
		}
	`,
	cacheTag: ({ instance, params }) => `url:${params.urls.join('/')}`,
	postProcess: ({ results }) => {
		if (results.bindings.length === 0) {
			return [];
		}
		const processed = [];
		results.bindings.forEach(bind => {
			processed.push({
				item: bind.item.value.replace(
					/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
					'$1',
				),
				url: bind.url.value,
			});
		});
		return processed;
	},
};
