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

async function updateSidebar(resolved) {
	try {
		await browser.runtime.sendMessage(
			browser.runtime.id,
			{
				type: 'display_entity',
				...resolved,
			},
		)
	} catch (error) {
		console.error(error);
	}
}

async function resolveUrl(url) {
	return await resolvers.resolve(url)
}

async function resolveAndUpdateSidebar(url) {
	const results = await resolveUrl(url)
	if (results) {
		await updateSidebar(results)
		return results
	}
}

const tabs = {}

browser.webNavigation.onCommitted.addListener(async function(details) {
	const currentTab = await getCurrentTab()
	if (details.tabId === currentTab.id) {
		const results = await resolveAndUpdateSidebar(details.url)
		tabs[details.tabId] = results
	} else {
		const results = await resolveUrl(details.url)
		tabs[details.tabId] = results
	}
})

browser.tabs.onActivated.addListener(function(activeInfo) {
	if (tabs?.[activeInfo.tabId]) {
		updateSidebar(tabs[activeInfo.tabId])
	}
}) 

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === "request_entity") {
		const currentTab = await getCurrentTab()
		const results = await resolveAndUpdateSidebar(currentTab.url)
		tabs[currentTab.id] = results
		return Promise.resolve("done")
	}
	return false;
})