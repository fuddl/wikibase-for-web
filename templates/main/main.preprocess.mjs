export default ({ vars, manager }) => {
	if (vars.activity == 'select') {
		browser.sidebarAction.setIcon({
			path: {
				16: browser.runtime.getURL(`/icons/disambiguate.svg`),
				32: browser.runtime.getURL(`/icons/disambiguate.svg`),
				64: browser.runtime.getURL(`/icons/disambiguate.svg`),
				128: browser.runtime.getURL(`/icons/disambiguate.svg`),
			},
		})
		browser.sidebarAction.setTitle({
			title: 'Disambiguate',
		})

	}
	if (manager.navigator.canGoBack()) {
		vars.back = true
	}
}