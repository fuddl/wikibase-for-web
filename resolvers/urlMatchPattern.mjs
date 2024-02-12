export const urlMatchPattern = {
	id: 'urlMatchPattern',
	applies: async function (location, { wikibase, queryManager }) {
		const patterns = await queryManager.query(wikibase, queryManager.queries.urlMatchPattern)
		const href = decodeURIComponent(location)
		
		const output = []

		for (const prop of patterns) {
			const match = href.match(prop.search)

			if (!match) {
				continue
			}
			
			let id = href.replace(prop.search, prop.replace)
			switch (prop.format) {
				case 'upper':
					id = id.toUpperCase();
					break;
				case 'lower':
				case 'insensitive':
					id = id.toLowerCase();
					break;
			}

			// @todo extract title

			// @todo handle isbn numbers?

			output.push({
				prop: prop.property,
				// label: label, @todo proposed label 
				value: id,
				case: prop.c ?? '',
			})
		
		}
		return output
	},
	resolve: async function (location, { wikibase, queryManager }) {
		const properties = await this.applies(location, { wikibase, queryManager })
		const entities = []
		const found = []
		for (const property of properties) {
			const results = await queryManager.query(wikibase, queryManager.queries.itemByExternalId, { prop: property.prop, id: property.value, case: property.case })
			for (const entity of results) {
				found.push(`${wikibase.id}:${entity}`)
			}
		}
		return found
	}
}
