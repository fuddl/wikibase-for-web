export const wikibase = {
	id: 'wikibase',
	getRegex: function (url) {
		const baseUrl = url.replace(/[.*+?^${}/()|[\]\\]/g, "\\$&")
		const pathPrefix = 'w(?:iki\\/|\\/index\\.php\\?title=)'
		const namespaces = '(?:Special:WhatLinksHere\\/|Talk:|Item:|Lexeme:|Property:)?'
		return new RegExp(`^${baseUrl}\\/${pathPrefix}${namespaces}([QMPL]\\d+)`)
	},
	applies: function (location, { wikibase }) {
		return location.match(this.getRegex(wikibase.instance)) !== null
	},
	resolve: function (location, { wikibase, wikibaseID }) {
		return [{
			id: `${wikibaseID}:${location.match(this.getRegex(wikibase.instance))[1]}`,
			specificity: 1000,
		}]
	}
}
