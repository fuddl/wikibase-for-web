export const hash = {
	id: 'hash',
	getRegex: function ({ id }) {
		return new RegExp(`^#${id}:([QMPL]\\d+)`);
	},
	getHash: function (location) {
		return URL.parse(location).hash ?? false;
	},
	applies: function (location, { wikibase }) {
		const hash = this.getHash(location);
		if (!hash) {
			return false;
		}
		return hash.match(this.getRegex(wikibase)) !== null
			? [{ specificity: 2000, instance: wikibase.id, matchFromUrl: location }]
			: [];
	},
	resolve: function ({ matchFromUrl, specificity }, { wikibase, wikibaseID }) {
		const hash = this.getHash(matchFromUrl);
		return [
			{
				specificity: specificity,
				id: `${wikibaseID}:${hash.match(this.getRegex(wikibase))[1]}`,
			},
		];
	},
};
