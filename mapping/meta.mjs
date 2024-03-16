import { resolvers } from '../resolvers/index.mjs';

async function metaToEdits({ meta, wikibase, lang = '', edits = [] }) {
	const processISBN = input => {
		const isbnProperties = {
			isbn13: {
				test: 'isIsbn13',
				format: 'isbn13h',
			},
			isbn10: {
				test: 'isIsbn10',
				format: 'isbn10h',
			},
		};

		const parsed = ISBN.parse(input);

		for (const key in isbnProperties) {
			if (parsed[isbnProperties[key].test] && key in wikibase.props) {
				return {
					prop: wikibase.props[key],
					id: parsed[isbnProperties[key].format],
				};
			}
		}
	};
	const tagMap = [
		// tags related to classes
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
		},
		// tags related to books
		{
			name: 'og:title',
			prop: 'title',
			type: 'monolingualtext',
		},
		{
			name: 'books:page_count',
			prop: 'numberOfPages',
			type: 'quantity',
		},
		{
			name: 'book:author',
			type: 'wikibase-item',
			prop: 'author',
		},
		{
			name: 'og:type',
			prop: 'occupation',
			type: 'wikibase-item',
			options: {
				'books.author': 'writer',
			},
		},
		{
			name: 'books:isbn',
			prop: 'isbn13',
			type: 'external-id',
			process: processISBN,
		},
		{
			name: 'book:isbn',
			prop: 'isbn13',
			type: 'external-id',
			process: processISBN,
		},
		{
			name: 'book:release_date',
			prop: 'publicationDate',
			type: 'time',
		},
		// tags related to audiovisual works
		{
			name: 'music:duration',
			type: 'quantity',
			prop: 'duration',
			hasTimeUnit: true,
		},
		{
			name: 'video:duration',
			type: 'quantity',
			prop: 'duration',
			hasTimeUnit: true,
		},
		{
			name: 'video:series',
			type: 'wikibase-item',
			prop: 'partOfTheSeries',
		},
		// misc
		{
			name: 'geo.position',
			type: 'globe-coordinate',
			prop: 'location',
		},
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
							datavalue: {
								value: {
									id: `${wikibase.id}:${targetValue}`,
								},
							},
						});
					} else if (URL.canParse(tag.content)) {
						const result = await resolvers.resolve(tag.content, wikibase.id);

						const options = result
							.map(suggestion => {
								if (suggestion.resolved) {
									return suggestion.resolved.map(resolved => resolved.id);
								}
							})
							.flat();
						if (options.length > 0) {
							newEdits.push({
								action: 'wbcreateclaim',
								property: `${wikibase.id}:${targetProperty}`,
								snaktype: 'value',
								datatype: item.type,
								datavalue:
									options.length === 1 ? { value: { id: options[0] } } : null,
								valueOptions:
									options.length > 1
										? options.map(option => {
												return option;
											})
										: null,
							});
						}
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
							datavalue: {
								value: {
									amount: `+${amount}`,
									unit: unit ?? '1',
								},
							},
						});
					}

					break;
				case 'external-id':
					if (item.prop in wikibase?.props) {
						let prop = targetProperty;
						let id = tag.content;
						if (item.process) {
							const { prop: processedProp, id: processedId } = item.process(
								tag.content,
							);
							prop = processedProp;
							id = processedId;
						}

						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${prop}`,
							snaktype: 'value',
							datatype: item.type,
							datavalue: { type: 'string', value: id },
						});
					}

					break;
				case 'globe-coordinate':
					if (item.prop in wikibase?.props) {
						const latlon = tag.content.split(';');
						const targetProperty = wikibase?.props[item.prop];

						if (latlon.length === 2) {
							newEdits.push({
								action: 'wbcreateclaim',
								property: `${wikibase.id}:${targetProperty}`,
								snaktype: 'value',
								datatype: item.type,
								datavalue: {
									type: 'globecoordinate',
									value: {
										latitude: latlon[0],
										longitude: latlon[1],
										globe: 'http://www.wikidata.org/entity/Q2',
										precision: 1,
									},
								},
							});
						}
					}

					break;
				case 'time':
					if (item.prop in wikibase?.props) {
						newEdits.push({
							action: 'wbcreateclaim',
							property: `${wikibase.id}:${targetProperty}`,
							snaktype: 'value',
							datatype: item.type,
							datavalue: {
								type: 'time',
								value: {
									after: 0,
									before: 0,
									calendarmodel: 'wikidata:Q1985727',
									precision: 11,
									time: `+${tag.content}T00:00:00Z`,
									timezone: 0,
								},
							},
						});
					}

					break;
			}
		}
	}

	return [...edits, ...newEdits];
}
export { metaToEdits };
