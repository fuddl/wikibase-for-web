import { resolvers } from '../resolvers/index.mjs';


function getCurrentTab() {
  // Query for the active tab in the current window
  return browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      // Since there can only be one active tab in the current window, take the first one
      if (tabs.length > 0) {
        return tabs[0];
      } else {
        throw new Error('No active tab found');
      }
    });
}

async function resolveAndUpdateSidebar(url) {
	const result = await resolvers.resolve(url)
	if (result) {
		try {
			await browser.runtime.sendMessage(
				browser.runtime.id,
				{
					type: 'display_entity',
					id: result,
				},
			)
		} catch (error) {
			console.error(error);
		}
	}
}

browser.webNavigation.onCommitted.addListener(function(details) {
	resolveAndUpdateSidebar(details.url)
})

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === "request_entity") {
		const currentTab = await getCurrentTab()
		resolveAndUpdateSidebar(currentTab.url)
		return Promise.resolve("done")
	}
	return false;
})