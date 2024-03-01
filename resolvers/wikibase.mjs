export const wikibase = {
	id: 'wikibase',
	getRegex: function (url) {
		const baseUrl = url.replace(/[.*+?^${}/()|[\]\\]/g, '\\$&');
		const pathPrefix = 'w(?:iki\\/|\\/index\\.php\\?title=)';
		const namespaces =
			'(?:Special:WhatLinksHere\\/|Talk:|Item:|Lexeme:|Property:)?';
		return new RegExp(`^${baseUrl}\\/${pathPrefix}${namespaces}([QMPL]\\d+)`);
	},
	applies: function (location, { wikibase }) {
		return location.match(this.getRegex(wikibase.instance)) !== null
			? [{ specificity: 1000, instance: wikibase.id, matchFromUrl: location }]
			: [];
	},
	resolve: function ({ matchFromUrl }, { wikibase, wikibaseID }) {
		return [
			{
				id: `${wikibaseID}:${matchFromUrl.match(this.getRegex(wikibase.instance))[1]}`,
			},
		];
	},
};
