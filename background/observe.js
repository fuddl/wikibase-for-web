import { resolvers, resolvedCache } from '../resolvers/index.mjs';
import { getTabMetadata } from '../modules/getTabMetadata.mjs';
import { WikibaseEditQueue } from '../modules/WikibaseEditQueue.mjs';
import { WikibaseEntityUsageTracker } from '../modules/WikibaseEntityUsageTracker.mjs';
import wikibases from '../wikibases.mjs';

const wikibaseEditQueue = new WikibaseEditQueue({
	resolvedCache: resolvedCache,
});

const contentTabsQuery = {
	url: ['http://*/*', 'https://*/*'],
	currentWindow: true,
	status: 'complete',
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

// Keep track if sidebar is open
let isSidebarOpen = false;

// Check sidebar state on startup
async function checkSidebarState() {
	try {
		isSidebarOpen = await browser.sidebarAction.isOpen({});
		
		// Start the sidebar check interval
		checkSidebarToUnhighlight(true);
		
		// If sidebar is open on startup, initialize with current tab
		if (isSidebarOpen) {
			const currentTab = await getCurrentTab();
			if (currentTab) {
				await resolveCurrentTab(currentTab.id);
			}
		}
	} catch (error) {
		console.error('Error checking sidebar state:', error);
		isSidebarOpen = false;
	}
}

// Call once on initialization
checkSidebarState();

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
			url: url.replace(/\#.+/, ''),
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

// Helper function to check if a tab is still active and no navigation occurred
async function isTabStillValidForUpdate(tabId, originalUrl) {
	// Check if the tab is still the active tab
	const currentTab = await getCurrentTab();
	const isStillActive = currentTab.id === tabId;
	
	// Check if the URL is still the same (no navigation occurred)
	const noNavigation = originalUrl && currentTab.url === originalUrl;
	
	// Return true only if the tab is still active and no navigation occurred
	return isStillActive && noNavigation;
}

async function updateSidebar(resolved) {
	if (!isSidebarOpen) return;
	
	await browser.runtime.sendMessage({
		type: 'resolved',
		candidates: resolved,
	});
}

async function resolveUrl(url) {
	return await resolvers.resolve(url);
}

async function resolveAndUpdateSidebar(url, tabId) {
	// Always check cache first
	if (tabId && resolvedCache.request(tabId)) {
		const cachedResults = resolvedCache.request(tabId);
		if (isSidebarOpen) {
			await updateSidebar(cachedResults);
		}
		return cachedResults;
	}
	
	// Only do a new resolution if the sidebar is open
	if (!isSidebarOpen) return null;
	
	const results = await resolveUrl(url);
	if (results) {
		await updateSidebar(results);
		// Always cache the results regardless of sidebar state
		if (tabId) {
			resolvedCache.add(tabId, url, results);
		}
		return results;
	}
	return null;
}

async function resolveCurrentTab(tabId) {
	const currentTab = await getCurrentTab();
	
	// First check cache before doing anything else
	if (resolvedCache.request(tabId)) {
		const cachedResults = resolvedCache.request(tabId);
		if (isSidebarOpen) {
			await updateSidebar(cachedResults);
		}
		return cachedResults;
	}
	
	// Don't proceed with resolution if sidebar is closed
	if (!isSidebarOpen) return null;
	
	if (
		currentTab.url.startsWith('about:') ||
		currentTab.url.startsWith('chrome:') ||
		currentTab.url.startsWith('moz-extension:') ||
		currentTab.url.startsWith('view-source:') ||
		currentTab.frameId > 0
	) {
		// early escape internal urls and navigation that occours in frames
		return null;
	}
	
	let results = [];
	if (tabId === currentTab.id) {
		// Store the URL we're resolving to check later if navigation occurred
		const urlToResolve = currentTab.url;
		
		results = await resolveUrl(currentTab.url);
		
		if (results && results.length > 0) {
			// Always cache results
			resolvedCache.add(tabId, currentTab.url, results);
			
			// Only update sidebar if the tab is still active and no navigation occurred
			if (isSidebarOpen && await isTabStillValidForUpdate(tabId, urlToResolve)) {
				await updateSidebar(results);
			}
		}
	} else {
		results = await resolveUrl(currentTab.url);
		if (results && results.length > 0) {
			// Always cache results
			resolvedCache.add(tabId, currentTab.url, results);
		}
	}
	
	return results;
}

browser.webNavigation.onCommitted.addListener(async function (details) {
	const currentTab = await getCurrentTab();
	
	// Always clear cache for the tab that navigated
	resolvedCache.remove(details.tabId);
	
	// Only resolve if sidebar is open
	if (isSidebarOpen && currentTab.id === details.tabId) {
		await resolveCurrentTab(details.tabId);
	}
});


let historyStateTimer = null;

browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  clearTimeout(historyStateTimer);

  historyStateTimer = setTimeout(async () => {
    const currentTab = await getCurrentTab();
    if (isSidebarOpen && currentTab.id === details.tabId) {
      resolvedCache.remove(details.tabId);
      await resolveCurrentTab(details.tabId);
    }
  }, 300);
});


let shouldHighlightLinks = false;

browser.tabs.onActivated.addListener(async activeInfo => {
	const { tabId } = activeInfo;

	// Always check cache first regardless of sidebar state
	if (resolvedCache.request(tabId)) {
		// If sidebar is open, update it with cached results
		if (isSidebarOpen) {
			await updateSidebar(resolvedCache.request(tabId));
		}
	} else if (isSidebarOpen) {
		// Only attempt new resolution if sidebar is open AND no cache exists
		await resolveCurrentTab(tabId);
	}
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === 'request_resolve') {
		if (!message.url) {
			const currentTab = await getCurrentTab();
			
			// Check cache first
			if (resolvedCache.request(currentTab.id)) {
				const cachedResults = resolvedCache.request(currentTab.id);
				if (isSidebarOpen) {
					await updateSidebar(cachedResults);
				}
				return Promise.resolve(cachedResults);
			}
			
			// Only do an actual resolution if the sidebar is open
			if (!isSidebarOpen) return Promise.resolve('sidebar closed');
			
			// Store current URL to check if navigation occurred
			const urlToResolve = currentTab.url;
			const tabToResolve = currentTab.id;
			
			const results = await resolveUrl(currentTab.url);
			
			if (results && results.length > 0) {
				// Always cache results
				resolvedCache.add(currentTab.id, currentTab.url, results);
				
				// Only update the sidebar if the tab is still active and no navigation occurred
				if (isSidebarOpen && await isTabStillValidForUpdate(tabToResolve, urlToResolve)) {
					await updateSidebar(results);
				}
				return Promise.resolve(results);
			}
			return Promise.resolve('done');
		} else {
			// For specific URL requests
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
		
		if (tabId) {
			// Store the URL to check for navigation
			const urlToResolve = message.url;
			
			// Always do a new resolution for hash changes as they might change the entity
			const results = await resolveUrl(message.url);
			
			if (results && results.length > 0) {
				// Always update the cache
				resolvedCache.add(tabId, message.url, results);
				
				// Only update the sidebar if it's open and this is still the active tab
				if (isSidebarOpen && await isTabStillValidForUpdate(tabId, urlToResolve)) {
					await updateSidebar(results);
				}
			}
		}
		
		return Promise.resolve('done');
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
		const activeTab = await getCurrentTab();
		await browser.tabs.sendMessage(activeTab.id, message);
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
			try {
				await browser.tabs.sendMessage(tab.id, message);
			} catch (error) {
				// tab may not respond due to it not being loaded
				console.error(error);
			}
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
			
			// Update the global sidebar state
			if (isSidebarOpen !== sidebarPanel) {
				isSidebarOpen = sidebarPanel;
				
				// If sidebar just opened, update with cached content for current tab
				if (isSidebarOpen) {
					const currentTab = await getCurrentTab();
					if (currentTab) {
						// Just show cached results for the current tab
						// without triggering a new resolution
						if (resolvedCache.request(currentTab.id)) {
							await updateSidebar(resolvedCache.request(currentTab.id));
						} else {
							// Only resolve if not in cache
							await resolveCurrentTab(currentTab.id);
						}
					}
				}
			}
			
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

const requestFilter = {
	urls: Object.values(wikibases).map(
		entry => `${entry.api.instance.apiEndpoint}*`,
	),
};

browser.webRequest.onCompleted.addListener(function (details) {
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
}, requestFilter);

browser.webRequest.onBeforeRequest.addListener(
	function (details) {
		if (details.method === 'POST') {
			const wbk = Object.values(wikibases).find(
				entry => entry.api.instance.apiEndpoint == details.url,
			);
			const tracker = new WikibaseEntityUsageTracker(wbk.id);
			const action = details.requestBody?.formData?.action;
			if (!action) {
				return;
			}

			if (action.includes('wbcreateclaim')) {
				if (details.requestBody?.formData?.entity?.length) {
					details.requestBody.formData.entity.forEach(entity => {
						tracker.add(entity, 'subject');
					});
				}
			}

			if (action.includes('wbsetclaim')) {
				if (details.requestBody?.formData?.claim?.[0]) {
					const claim = JSON.parse(details.requestBody.formData.claim[0]);

					if (claim?.id) {
						tracker.add(claim.id.split('$')[0], 'subject');
					}

					if (claim?.mainsnak?.property) {
						tracker.add(claim.mainsnak.property);
					}
					if (claim?.mainsnak?.datavalue?.value?.id) {
						tracker.add(claim.mainsnak.datavalue.value.id, 'object');
					}
				}
			}
		}
	},
	requestFilter,
	['requestBody'],
);

browser.webNavigation.onBeforeNavigate.addListener(details => {
	resolvedCache.remove(details.tabId);
});

browser.browserAction.onClicked.addListener(async () => {
	await browser.sidebarAction.toggle();
	
	// Update sidebar state after toggle
	isSidebarOpen = await browser.sidebarAction.isOpen({});
	
	// Start/restart the check interval
	checkSidebarToUnhighlight(isSidebarOpen);
});

// Add listener for keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-sidebar") {
        await browser.sidebarAction.toggle();
        
        // Update sidebar state after toggle
        isSidebarOpen = await browser.sidebarAction.isOpen({});
        
        // Start/restart the check interval
        checkSidebarToUnhighlight(isSidebarOpen);
    }
});
