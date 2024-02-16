export default ({ vars }) => {
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
}