import { resolvers } from '../resolvers/index.mjs';
import {
	ExternalIdClaim,
	GlobeCoordinateClaim,
	MonolingualTextClaim,
	QuantityClaim,
	TimeClaim,
	WikibaseItemClaim,
} from '../types/Claim.mjs';
import ISBN from '../importmap/isbn3-es6/isbn.js';

async function metaToEdits({ meta, wikibase, metadata, references }) {
	const makeSignature = tag => {
		return ['meta', new URL(metadata.location).hostname, `[${tag}]`].join(':');
	};

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
				'books.book': ['versionEditionOrTranslation', 'literaryWork'],
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
			disabledByDefault: true,
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
					if (metadata?.lang && tag) {
						newEdits.push({
							action: 'claim:create',
							signature: makeSignature(tag.name),
							disabledByDefault: item?.disabledByDefault ?? false,
							claim: new MonolingualTextClaim({
								property: `${wikibase.id}:${targetProperty}`,
								text: tag.content,
								language: metadata.lang.toLowerCase(),
								references: references,
							}),
						});
					}
					break;
				case 'wikibase-item':
					if (
						item?.options &&
						(Array.isArray(item.options[tag.content])
							? item.options[tag.content].some(
									option => option in wikibase?.items,
								)
							: item.options[tag.content] in wikibase?.items)
					) {
						let targetValue = !Array.isArray(item?.options[tag.content])
							? `${wikibase.id}:${wikibase?.items[item.options[tag.content]]}`
							: item?.options[tag.content].map(
									target => `${wikibase.id}:${wikibase?.items[target]}`,
								);

						newEdits.push({
							action: 'claim:create',
							signature: makeSignature(tag.name),
							disabledByDefault: item?.disabledByDefault ?? false,
							claim: new WikibaseItemClaim({
								property: `${wikibase.id}:${targetProperty}`,
								value: targetValue,
								references: references,
							}),
						});
					} else if (URL.canParse(tag.content)) {
						const result = await resolvers.resolve(tag.content, [wikibase.id]);

						const options = result
							.map(suggestion => {
								if (suggestion.resolved) {
									return suggestion.resolved.map(resolved => resolved.id);
								}
							})
							.flat();

						if (options.length > 0) {
							newEdits.push({
								action: 'claim:create',
								signature: makeSignature(tag.name),
								disabledByDefault: item?.disabledByDefault ?? false,
								claim: new WikibaseItemClaim({
									property: `${wikibase.id}:${targetProperty}`,
									value: options,
									references: references,
								}),
							});
						}
					}

					break;
				case 'quantity':
					if (item.prop in wikibase?.props) {
						const { amount, unit } = item?.hasTimeUnit
							? getDurationUnit(tag.content)
							: { amount: tag.content, unit: undefined };

						newEdits.push({
							action: 'claim:create',
							signature: makeSignature(tag.name),
							disabledByDefault: item?.disabledByDefault ?? false,
							claim: new QuantityClaim({
								property: `${wikibase.id}:${targetProperty}`,
								amount: `+${amount}`,
								unit: unit,
								references: references,
							}),
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
							action: 'claim:create',
							signature: makeSignature(tag.name),
							disabledByDefault: item?.disabledByDefault ?? false,
							claim: new ExternalIdClaim({
								property: `${wikibase.id}:${prop}`,
								value: id,
								references: references,
							}),
						});
					}

					break;
				case 'globe-coordinate':
					if (item.prop in wikibase?.props) {
						const latlon = tag.content.split(';');
						const targetProperty = wikibase?.props[item.prop];

						if (latlon.length === 2) {
							newEdits.push({
								action: 'claim:create',
								signature: makeSignature(tag.name),
								disabledByDefault: item?.disabledByDefault ?? false,
								claim: new GlobeCoordinateClaim({
									property: `${wikibase.id}:${targetProperty}`,
									latitude: latlon[0],
									longitude: latlon[1],
									precision: 1,
								}),
								references: references,
							});
						}
					}

					break;
				case 'time':
					if (item.prop in wikibase?.props) {
						newEdits.push({
							action: 'claim:create',
							signature: makeSignature(tag.name),
							disabledByDefault: item?.disabledByDefault ?? false,
							claim: new TimeClaim({
								property: `${wikibase.id}:${targetProperty}`,
								time: `+${tag.content}T00:00:00Z`,
								precision: 11,
								references: references,
							}),
						});
					}

					break;
			}
		}
	}

	return newEdits;
}
export { metaToEdits };
