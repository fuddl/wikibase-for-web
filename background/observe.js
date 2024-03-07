import { resolvers } from '../resolvers/index.mjs';
import { getTabMetadata } from '../modules/getTabMetadata.mjs';
import { WikibaseEditQueue } from '../modules/WikibaseEditQueue.mjs';
import wikibases from '../wikibases.mjs';

const wikibaseEditQueue = new WikibaseEditQueue();

wikibaseEditQueue.setProgressUpdateCallback(async queue => {
	try {
		await browser.runtime.sendMessage(browser.runtime.id, {
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
		const tabs = await browser.tabs.query({ url: url });

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
	await browser.runtime.sendMessage(browser.runtime.id, {
		type: 'resolved',
		candidates: resolved,
	});
}

async function resolveUrl(url) {
	return await resolvers.resolve(url);
}

async function resolveAndUpdateSidebar(url, tabId) {
	const results = await resolveUrl(url, tabId);
	if (results) {
		await updateSidebar(results);
		return results;
	}
}

const tabs = {};

browser.webNavigation.onCommitted.addListener(async function (details) {
	const currentTab = await getCurrentTab();
	if (details.tabId === currentTab.id) {
		const results = await resolveAndUpdateSidebar(details.url, details.tabId);
		tabs[details.tabId] = results;
	} else {
		const results = await resolveUrl(details.url, details.tabId);
		tabs[details.tabId] = results;
	}
});

browser.tabs.onActivated.addListener(function (activeInfo) {
	if (tabs?.[activeInfo.tabId]) {
		updateSidebar(tabs[activeInfo.tabId]);
	}
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.type === 'request_entity') {
		const currentTab = await getCurrentTab();
		const results = await resolveAndUpdateSidebar(
			currentTab.url,
			currentTab.id,
		);
		tabs[currentTab.id] = results;
		return Promise.resolve('done');
	} else if (message.type === 'add_to_edit_queue') {
		wikibaseEditQueue.addJobs(message.edits);
		return Promise.resolve('done');
	} else if (message.type === 'request_metadata') {
		const tabId = await findTabByUrl(message.url);
		const metadata = await getTabMetadata(tabId);
		return Promise.resolve({ response: metadata });
	}
	return false;
});

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
