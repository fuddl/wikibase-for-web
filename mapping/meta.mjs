import { resolvers } from '../resolvers/index.mjs';

function metaToEdits({ meta, wikibase, lang = '', edits = [] }) {
	const tagMap = [
		{
			name: 'og:title',
			prop: 'title',
			type: 'monolingualtext',
			suggested: false,
		},
		{
			name: 'og:type',
			prop: 'instanceOf',
			type: 'wikibase-item',
			options: {
				'books.author': 'human',
				'books.book': 'edition',
				'music.album': 'album',
				'music.playlist': 'playlist',
				'music.radio_station': 'radioStation',
				'music.song': 'musicalWork',
				'video.episode': 'televisionSeriesEpisode',
				'video.movie': 'film',
				'video.tv_show': 'televisionSeries',
				'wdff.edition': 'versionEditionOrTranslation',
			},
			suggested: false,
		},
		{
			name: 'og:type',
			prop: 'occupation',
			type: 'wikibase-item',
			options: {
				'books.author': 'writer',
			},
			suggested: false,
		},
		{
			name: 'music:duration',
			type: 'quantity',
			prop: 'duration',
			suggested: true,
			hasTimeUnit: true,
		},
		{
			name: 'video:duration',
			type: 'quantity',
			prop: 'duration',
			suggested: true,
			hasTimeUnit: true,
		},
		{
			name: 'video:series',
			type: 'wikibase-item',
			prop: 'partOfTheSeries',
			suggested: true,
		},
		// {
		// 	name: 'books:author',
		// 	type: 'WikibaseItem',
		// 	prop: 'P50',
		// 	suggested: true,
		// },
		// {
		// 	name: 'books:isbn',
		// 	prop: 'P212',
		// 	type: 'ExternalId',
		// 	process: input => {
		// 		const isbnProperties = {
		// 			P212: {
		// 				test: 'isIsbn13',
		// 				format: 'isbn13h',
		// 			},
		// 			P957: {
		// 				test: 'isIsbn10',
		// 				format: 'isbn10h',
		// 			},
		// 		};

		// 		const parsed = ISBN.parse(input);

		// 		for (const key in isbnProperties) {
		// 			if (parsed[isbnProperties[key].test]) {
		// 				return {
		// 					prop: key,
		// 					id: parsed[isbnProperties[key].format],
		// 				};
		// 			}
		// 		}
		// 	},
		// 	suggested: true,
		// },
		// {
		// 	name: 'books:page_count',
		// 	prop: 'P1104',
		// 	type: 'Quantity',
		// 	suggested: true,
		// },
	];

	const durationMap = [
		{
			item: 'second',
			seconds: 1,
		},
		{
			item: 'minute',
			seconds: 60,
		},
		{
			item: 'hour',
			seconds: 3600,
		},
		{
			item: 'day',
			seconds: 86400,
		},
		{
			item: 'week',
			seconds: 604800,
		},
		{
			item: 'year',
			seconds: 31557600,
		},
	];

	const getDurationUnit = amount => {
		let output = { amount: amount, unit: null };
		for (const interval of durationMap) {
			let divided = amount / interval.seconds;
			if (
				divided > 1 &&
				divided % 1 === 0 &&
				amount !== divided &&
				interval.item in wikibase.items
			) {
				output = {
					amount: divided,
					unit: `${wikibase.id}:${wikibase.items[interval.item]}`,
				};
			}
		}
		return output;
	};

	const newEdits = [];

	for (const item of tagMap) {
		if (item.prop in wikibase?.props) {
			const targetProperty = wikibase?.props[item.prop];
			const tag = meta.find(t => t.name == item.name);
			if (!tag) {
				continue;
			}
			switch (item.type) {
				case 'monolingualtext':
					if (lang && tag) {
						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${targetProperty}`,
							snaktype: 'value',
							datatype: item.type,
							datavalue: {
								value: {
									text: tag.content,
									language: lang,
								},
							},
						});
					}
					break;
				case 'wikibase-item':
					if (item?.options && item?.options[tag.content] in wikibase?.items) {
						const targetValue = wikibase?.items[item.options[tag.content]];
						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${targetProperty}`,
							snaktype: 'value',
							datatype: item.type,
							datavalue: { value: { id: `${wikibase.id}:${targetValue}` } },
						});
					} else {
						resolvers.resolve(tag.content, { wikibase }).then(result => {
							const options = result
								.map(suggestion => {
									if (suggestion.resolved) {
										return suggestion.resolved.map(resolved => {
											return resolved.id;
										});
									}
								})
								.flat();
							if (options.length > 0) {
								newEdits.push({
									action: 'wbcreateclaim',
									property: `${wikibase.id}:${targetProperty}`,
									snaktype: 'value',
									datatype: item.type,
									datavalueOptions: options.map(option => {
										return { id: option };
									}),
								});
							}
						});
					}

					break;
				case 'quantity':
					if (item.prop in wikibase?.props) {
						const { amount, unit } = item?.hasTimeUnit
							? getDurationUnit(tag.content)
							: { amount: tag.content, unit: null };

						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${targetProperty}`,
							snaktype: 'value',
							datatype: item.type,
							datavalue: { value: { amount: amount, unit: unit } },
						});
					}

					break;
			}
		}
	}

	console.debug(newEdits);

	return [...edits, ...newEdits];
}
export { metaToEdits };
