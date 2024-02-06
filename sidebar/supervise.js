import { WBK } from '../node_modules/wikibase-sdk/dist/src/wikibase-sdk.js'
import { render } from './render.mjs'

const wbk = WBK({
	instance: 'https://www.wikidata.org',
	sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

const entities = []

function getEntityLink(id, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
	return wbk.getEntities({
		ids: [ id ],
		languages: [ 'en', 'fr', 'de' ], 
		props: props,
		redirections: false,
	})
}

async function getEntity(id, props = [ 'info', 'claims', 'labels', 'descriptions', 'sitelinks/urls' ]) {
	const internalId = id.split(':')[1]
	const url = getEntityLink(internalId, props)

	const result = await fetch(url).then(res => res.json())
	return result.entities[internalId]
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "display_entity") {
		entities.find(entity => entity.id === message.id) || entities.push({ id: message.id });

		(async () => {
			entities.forEach((entity) => {
				entity.active = entity.id === message.id
			})
			await Promise.all(entities.map(async (entity) => {
				if (entity.active && !entity.data) {
					entity.data = await getEntity(entity.id)
				}
			}))
			render({ get: getEntity, getLink: getEntityLink })
		})()
		return Promise.resolve('done')
	}
	return false;
})

document.entities = entities

try {
	await browser.runtime.sendMessage(
		browser.runtime.id,
		{
			type: 'request_entity',
		},
	)
} catch (error) {
	console.error(error);
}