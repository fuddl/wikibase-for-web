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

async function updateSidebar(id) {
	try {
		await browser.runtime.sendMessage(
			browser.runtime.id,
			{
				type: 'display_entity',
				id: id,
			},
		)
	} catch (error) {
		console.error(error);
	}
}

async function resolveAndUpdateSidebar(url) {
	const results = await resolvers.resolve(url)
	if (results) {
		await updateSidebar(results[0])
		return results[0]
	}
}

const tabs = {}

browser.webNavigation.onCommitted.addListener(async function(details) {
	const entities = await resolveAndUpdateSidebar(details.url)
	tabs[details.tabId] = entities
})

browser.tabs.onActivated.addListener(function(activeInfo) {
	console.debug(tabs?.[activeInfo.tabId])
	if (tabs?.[activeInfo.tabId]) {
		updateSidebar(tabs[activeInfo.tabId])
	}
}) 

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === "request_entity") {
		const currentTab = await getCurrentTab()
		resolveAndUpdateSidebar(currentTab.url)
		return Promise.resolve("done")
	}
	return false;
})