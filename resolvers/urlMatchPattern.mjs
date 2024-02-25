export const urlMatchPattern = {
	id: 'urlMatchPattern',
	applies: async function (location, { wikibase, queryManager, metadata }) {
		const patterns = await queryManager.query(
			wikibase,
			queryManager.queries.urlMatchPattern,
		);
		const href = decodeURIComponent(location);

		const output = [];

		for (const prop of patterns) {
			const match = href.match(prop.search);

			if (!match) {
				continue;
			}

			let id = href.replace(prop.search, prop.replace);
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
				if (metadata?.title && prop?.title) {
					try {
						const extractionResult = new RegExp(prop.title, 'g').exec(
							metadata.title,
						);
						if (extractionResult?.[1]) {
							return extractionResult[1];
						} else {
							return false;
						}
					} catch (e) {
						console.warn(
							'This title extractor regex is probably not valid',
							JSON.stringify(prop, null, 2),
						);
					}
				}
				return metadata?.title;
			};

			const proposeEdits = [];

			proposeEdits.push({
				action: 'wbcreateclaim',
				property: prop.property,
				snaktype: 'value',
				value: `"${id}"`,
				status: 'required',
			});

			if (getLabel() && metadata.lang) {
				proposeEdits.push({
					action: 'wbsetaliases',
					add: getLabel(),
					language: metadata.lang,
				});
			}

			output.push({
				proposeEdits: proposeEdits,
				label: getLabel() ?? metadata?.title,
				references: wikibase.props.referenceURL
					? [
							{
								snacks: {
									[wikibase.props.referenceURL]: [
										{
											property: wikibase.props.referenceURL,
											datatype: 'url',
											datavalue: {
												value: location,
												type: 'string',
											},
										},
									],
								},
							},
						]
					: [],
				specificity: prop.search.toString().length,
				instance: wikibase.id,
				property: prop.property,
				value: id,
			});
		}

		return output;
	},
	resolve: async function (location, { wikibase, queryManager }) {
		const properties = await this.applies(location, {
			wikibase,
			queryManager,
		});
		const entities = [];
		const found = [];
		for (const { property, value, specificity } of properties) {
			const results = await queryManager.query(
				wikibase,
				queryManager.queries.itemByExternalId,
				{
					property: property,
					id: value,
				},
			);
			for (const entity of results) {
				found.push({
					prop: property,
					id: `${wikibase.id}:${entity}`,
					specificity: specificity,
				});
			}
		}
		return found;
	},
};
