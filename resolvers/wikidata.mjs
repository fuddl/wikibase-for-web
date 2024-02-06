export const wikidata = {
	id: 'wikidata',
	regex: /^https:\/\/[\w]+.wikidata.org\/w(?:iki\/|\/index\.php\?title=)(?:Special:WhatLinksHere\/|Talk:)?(?:\w+:)?([QMPL]\d+)/,
	applies: function (location) {
		return location.match(this.regex) !== null
	},
	resolve: function (location) {
		return location.match(this.regex)[1]
	}
}
