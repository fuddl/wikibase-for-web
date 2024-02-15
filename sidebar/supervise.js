import { render } from './render.mjs'
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs'

const manager = new WikiBaseEntityManager({
	render: render,
	languages: navigator.languages,
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "display_entity") {
		try {
			manager.addEntities(message.ids)
		} catch (e) {
			console.error(e)
		}

		(async () => {
			if (message.ids.length < 2) {
				await manager.activate(message.ids)
			} else {
				await manager.selector(message.ids)
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