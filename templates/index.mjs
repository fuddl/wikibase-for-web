async function loadTemplate(name) {
	return await fetch(browser.runtime.getURL(`templates/${name}/${name}.twig`)).then(res => res.text())
}
async function loadPreprocess(name) {
	const dynamicModile = await import(browser.runtime.getURL(`templates/${name}/${name}.preprocess.mjs`))
	return dynamicModile.default
}
async function loadPostprocess(name) {
	const dynamicModile = await import(browser.runtime.getURL(`templates/${name}/${name}.postprocess.mjs`))
	return dynamicModile.default
}

const templateDefinition = [
	{
		id: 'main',
		style: true,
	},
	{
		id: 'ensign',
		style: true,
		preprocess: true,
	},
	{
		id: 'remark',
		preprocess: true,
		style: true,
	},
	{
		id: 'thing',
		postprocess: true,
	},
	{
		id: 'nerd',
	},
]

export const Templates = await Promise.all(templateDefinition.map(async (item) => {
	const template = await loadTemplate(item.id)
	if (item.preprocess) {
		item.preprocess = await loadPreprocess(item.id)
	}
	if (item.postprocess) {
		item.postprocess = await loadPostprocess(item.id)
	}
	if (item?.style === true) {
		item.style = [
			browser.runtime.getURL(`templates/${item.id}/${item.id}.css`)
		]
	}
	item.template = template
		.replace(/{%\s+include '([^']+)'\s%}/gm, `{{ include_$1({}, _context) }}`)
		.replace(/{%\s+include '([^']+)'\s+with\s+([^%]+)\s%}/gm, `{{ include_$1($2, _context) }}`)
	return item
}));