// Register native context menu item for Ensign elements in the sidebar
function createContextMenu() {
	browser.contextMenus.removeAll().then(() => {
		browser.contextMenus.create({
			id: 'edit-wikibase-element',
			title: browser.i18n.getMessage('edit_descriptions') || 'Edit descriptions',
			contexts: ['all'],
			documentUrlPatterns: [browser.runtime.getURL('/sidebar/index.html')],
			visible: false,
		});
	}).catch(err => console.error('Error creating context menu:', err));
}

createContextMenu();

browser.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId === 'edit-wikibase-element') {
		try {
			await browser.runtime.sendMessage({
				type: 'execute_context_edit',
			});
		} catch (error) {
			console.error('Error forwarding context edit action:', error);
		}
	}
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'show_context_menu') {
		return browser.contextMenus.update('edit-wikibase-element', { visible: true })
			.then(() => true)
			.catch(error => {
				console.error(error);
				return true;
			});
	} else if (message.type === 'hide_context_menu') {
		return browser.contextMenus.update('edit-wikibase-element', { visible: false })
			.then(() => true)
			.catch(error => {
				console.error(error);
				return true;
			});
	}
});
