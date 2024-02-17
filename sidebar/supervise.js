import { render } from './render.mjs'
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs'

const manager = new WikiBaseEntityManager({
	render: render,
	languages: navigator.languages,
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "display_entity") {
		try {
			manager.addEntities(message.resolved.map((item) => item.id))
		} catch (e) {
			console.error(e)
		}

		(async () => {
			if (message.resolved.length < 2) {
				await manager.navigator.resetHistory({
					activity: 'view',
					id: message.resolved[0].id,
				})
			} else {
				await manager.navigator.resetHistory({
					activity: 'select',
					ids: message.resolved.map((item) => item.id),
				})
			}
		})()
		return Promise.resolve('done')
	}
	return false;
})

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