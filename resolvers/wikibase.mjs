export const wikibase = {
	id: 'wikibase',
	getRegex: function (url) {
		const baseUrl = url.replace(/[.*+?^${}/()|[\]\\]/g, "\\$&")
		const pathPrefix = 'w(?:iki\\/|\\/index\\.php\\?title=)'
		const namespaces = '(?:Special:WhatLinksHere\\/|Talk:|Item:|Lexeme:|Property:)?'
		return new RegExp(`^${baseUrl}\\/${pathPrefix}${namespaces}([QMPL]\\d+)`)
	},
	applies: function (location, context) {
		return location.match(this.getRegex(context.instance)) !== null
	},
	resolve: function (location, context) {
		return `${context.id}:${location.match(this.getRegex(context.instance))[1]}`
	}
}
