export const urlMatchPattern = {
	id: 'urlMatchPattern',
	applies: async function (location, { wikibase, queryManager, title }) {
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

			const getLabel = () => {
				if (title && prop?.title) {
					try {
						const extractionResult = new RegExp(prop.title , 'g').exec(title)
						if (extractionResult?.[1]) {
							return extractionResult[1]
						} else {
							return title
						}
					} catch(e) {
						console.warn('This title extractor regex is probably not valid', JSON.stringify(prop, null, 2))
					}
				}
				return title
			}

			output.push({
				snack: {
					snaktype: 'value',
					datatype: 'external-id',
					property: prop.property,
					datavalue: { value: id, type: 'string' },
				},
				label: getLabel(),
				references: wikibase.props.referenceURL ? [{
					snacks: {
						[wikibase.props.referenceURL]: [{
							property: wikibase.props.referenceURL,
							datatype: 'url',
							datavalue: {
								value: location,
								type: 'string',
							}
						}],
					},
				}] : [],
				specificity: prop.search.toString().length,
				instance: wikibase.id,
			})
		
		}
		return output
	},
	resolve: async function (location, { wikibase, queryManager }) {
		const properties = await this.applies(location, { wikibase, queryManager })
		const entities = []
		const found = []
		for (const { snack } of properties) {
			const results = await queryManager.query(wikibase, queryManager.queries.itemByExternalId, {
				property: snack.property,
				id: snack.datavalue.value,
			})
			for (const entity of results) {
				found.push({
					prop: property.prop,
					id: `${wikibase.id}:${entity}`,
					specificity: property.specificity,
				})
			}
		}
		return found
	}
}
