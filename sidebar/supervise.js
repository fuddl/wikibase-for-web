import { render } from './render.mjs'
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs'

const manager = new WikiBaseEntityManager()

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "display_entity") {
		try {
			manager.addEntity(message.id)
		} catch (e) {
			console.error(e)
		}

		(async () => {
			await manager.activate(message.id)
			render(manager)
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