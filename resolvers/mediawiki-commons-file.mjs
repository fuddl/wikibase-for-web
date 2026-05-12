import { fetchJSON } from '../modules/fetch.mjs';

export const mediawikiCommonsFile = {
	id: 'mediawikiCommonsFile',

	applies: async function (url, { wikibase }) {
		if (wikibase.id !== 'commons') {
			return [];
		}
		const parsedUrl = new URL(url);
		if (parsedUrl.hostname !== 'commons.wikimedia.org') {
			return [];
		}

		// Match File: namespace in the path
		// Pattern: /wiki/File:Filename or /w/index.php?title=File:Filename
		let filename = null;
		if (parsedUrl.pathname.startsWith('/wiki/File:')) {
			filename = decodeURIComponent(parsedUrl.pathname.substring(6));
		} else if (parsedUrl.pathname.startsWith('/w/index.php')) {
			const title = parsedUrl.searchParams.get('title');
			if (title && title.startsWith('File:')) {
				filename = title;
			}
		}

		if (!filename) {
			return [];
		}

		return [{
			specificity: 1000,
			instance: 'commons',
			matchFromUrl: url,
			filename: filename,
		}];
	},

	resolve: async function (apply, context) {
		const { filename } = apply;
		const { signal } = context;

		const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&format=json&origin=*`;

		try {
			const data = await fetchJSON(apiUrl, { signal });
			const pages = data?.query?.pages;
			if (!pages) {
				return null;
			}

			const pageIds = Object.keys(pages);
			if (pageIds.length === 0 || pageIds[0] === '-1') {
				return null;
			}

			const pageid = pages[pageIds[0]].pageid;
			if (!pageid) {
				return null;
			}

			return [{
				id: `commons:M${pageid}`,
				specificity: 1000,
			}];
		} catch (error) {
			console.error('Error resolving MediaWiki Commons file:', error);
			return null;
		}
	},
};
