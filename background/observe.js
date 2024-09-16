import { resolvers, resolvedCache } from '../resolvers/index.mjs';
import { getTabMetadata } from '../modules/getTabMetadata.mjs';
import { WikibaseEditQueue } from '../modules/WikibaseEditQueue.mjs';
import wikibases from '../wikibases.mjs';

const wikibaseEditQueue = new WikibaseEditQueue({
	resolvedCache: resolvedCache,
});

const contentTabsQuery = {
	url: ['http://*/*', 'https://*/*'],
};

wikibaseEditQueue.setProgressUpdateCallback(async queue => {
	try {
		await browser.runtime.sendMessage({
			type: 'update_edit_queue_progress',
			...queue,
		});
	} catch (error) {
		console.error(error);
	}
});

function getCurrentTab() {
	// Query for the active tab in the current window
	return browser.tabs
		.query({ active: true, currentWindow: true })
		.then(tabs => {
			// Since there can only be one active tab in the current window, take the first one
			if (tabs.length > 0) {
				return tabs[0];
			} else {
				throw new Error('No active tab found');
			}
		});
}

async function findTabByUrl(url) {
	try {
		const tabs = await browser.tabs.query({
			url: url.replace(/:\d+/, '').replace(/\#.+/, ''),
		});

		if (tabs.length > 0) {
			const firstTab = tabs[0];
			return firstTab.id; // Return the ID of the first matching tab
		} else {
			console.log(`No tabs found with URL: ${url}`);
			return null; // No matching tabs found
		}
	} catch (error) {
		console.error(`Error finding tab by URL: ${error}`);
		return null; // Error case
	}
}

async function updateSidebar(resolved) {
	await browser.runtime.sendMessage({
		type: 'resolved',
		candidates: resolved,
	});
}

async function resolveUrl(url) {
	return await resolvers.resolve(url);
}

async function resolveAndUpdateSidebar(url) {
	const results = await resolveUrl(url);
	if (results) {
		await updateSidebar(results);
		return results;
	}
}

const tabs = {};

async function resolveCurrentTab(tabId) {
	const currentTab = await getCurrentTab();
	if (
		currentTab.url.startsWith('about:') ||
		currentTab.url.startsWith('chrome:') ||
		currentTab.url.startsWith('moz-extension:') ||
		currentTab.frameId > 0
	) {
		// early escape internal urls and navigation that occours in frames
		return;
	}
	if (tabId === currentTab.id) {
		const results = await resolveAndUpdateSidebar(currentTab.url, tabId);
		tabs[tabId] = results;
	} else {
		const results = await resolveUrl(currentTab.url, tabId);
		tabs[tabId] = results;
	}
}

browser.webNavigation.onCommitted.addListener(async function (details) {
	const currentTab = await getCurrentTab();
	if (currentTab.id === details.tabId) {
		await resolveCurrentTab(details.tabId);
	} else {
		await resolveUrl(details.url);
	}
});

browser.webNavigation.onHistoryStateUpdated.addListener(
	async function (details) {
		const currentTab = await getCurrentTab();
		if (currentTab.id === details.tabId) {
			await resolveCurrentTab(details.tabId);
		} else {
			await resolveUrl(details.url);
		}
	},
);

let shouldHighlightLinks = false;

browser.tabs.onActivated.addListener(async activeInfo => {
	const { tabId } = activeInfo;

	if (tabs?.[tabId]) {
		updateSidebar(tabs[tabId]);
	} else {
		await resolveCurrentTab(tabId);
	}
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === 'request_resolve') {
		if (!message.url) {
			const currentTab = await getCurrentTab();
			const results = await resolveAndUpdateSidebar(
				currentTab.url,
				currentTab.id,
			);
			tabs[currentTab.id] = results;
			return Promise.resolve('done');
		} else {
			const results = await resolveUrl(message.url);
			return results;
		}
	} else if (message.type === 'add_to_edit_queue') {
		wikibaseEditQueue.addJobs(message.edits, message.viewId);
		return Promise.resolve('done');
	} else if (message.type === 'request_metadata') {
		const tabId = await findTabByUrl(message.url);
		const metadata = await getTabMetadata(tabId);
		return Promise.resolve({ response: metadata });
	} else if (message.type === 'hash_changed') {
		const tabId = await findTabByUrl(message.url);
		const results = await resolveAndUpdateSidebar(message.url, tabId);
	} else if (message.type === 'request_navigate') {
		try {
			await browser.runtime.sendMessage({
				type: 'navigate',
				entity: message.entity,
			});
		} catch (error) {
			console.error(error);
		}
		return Promise.resolve('done');
	} else if (message.type === 'request_workbench') {
		try {
			await browser.runtime.sendMessage({
				type: 'workbench',
				workbench: message.workbench,
			});
		} catch (error) {
			console.error(error);
		}
		return Promise.resolve('done');
	} else if (message.type === 'highlight_elements') {
		// Forward 'highlight_links' to the active tab
		shouldHighlightLinks = message ?? true;
		for (const tab of await browser.tabs.query(contentTabsQuery)) {
			await browser.tabs.sendMessage(tab.id, message);
		}
		await checkSidebarToUnhighlight(true);

		return true;
	} else if (message.type === 'unhighlight_elements') {
		// Forward 'unhighlight_links' to all open tabs
		for (const tab of await browser.tabs.query(contentTabsQuery)) {
			await browser.tabs.sendMessage(tab.id, { type: 'unhighlight_elements' });
		}
		shouldHighlightLinks = false;
		await checkSidebarToUnhighlight(false);

		return true;
	} else if (message.type === 'highlight_jobs') {
		// Forward 'highlight_jobs' to all open tabs
		for (const tab of await browser.tabs.query(contentTabsQuery)) {
			await browser.tabs.sendMessage(tab.id, message);
		}

		return true;
	}
	return false;
});

let sidebarCheckInterval = null;

// Function to check if the sidebar is open, to unhighlight links when the
// user chooses to close thie sidebar. we need this since there is no event
// listener for that. nor does the sidebar window have a onbeforunload event
async function checkSidebarToUnhighlight(active) {
	if (active && !sidebarCheckInterval) {
		// Start the interval if it's not already running

		sidebarCheckInterval = setInterval(async () => {
			const sidebarPanel = await browser.sidebarAction.isOpen({});
			if (!sidebarPanel) {
				// If the sidebar is closed, send 'unhighlight_links' to all tabs
				for (const tab of await browser.tabs.query(contentTabsQuery)) {
					await browser.tabs.sendMessage(tab.id, {
						type: 'unhighlight_elements',
					});
				}
				shouldHighlightLinks = false;

				// Stop the sidebar check once it's closed
				checkSidebarToUnhighlight(false);
			}
		}, 1000); // Check every second
	} else {
		// Stop the interval if it's running
		if (sidebarCheckInterval) {
			clearInterval(sidebarCheckInterval);
			sidebarCheckInterval = null;
		}
	}
}

browser.webRequest.onCompleted.addListener(
	function (details) {
		if (details.method === 'POST') {
			const wbk = Object.values(wikibases).find(
				entry => entry.api.instance.apiEndpoint == details.url,
			);

			const editedEnity = details.originUrl
				.replace(wbk.instance, '')
				.match(/([QPLM]\d+)/);

			if (editedEnity) {
				browser.runtime
					.sendMessage({
						type: 'update_entity',
						entity: `${wbk.id}:${editedEnity[0]}`,
					})
					.then(response => {})
					.catch(error => console.error('Message failed:', error));
			}
		}
	},
	{
		urls: Object.values(wikibases).map(
			entry => `${entry.api.instance.apiEndpoint}*`,
		),
	},
);

browser.webNavigation.onBeforeNavigate.addListener(details => {
	if (tabs?.[details.tabId]) {
		delete tabs[details.tabId];
	}
});

browser.browserAction.onClicked.addListener(async () => {
	await browser.sidebarAction.toggle();
});
