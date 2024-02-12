async function loadTemplate(name) {
	return await fetch(browser.runtime.getURL(`templates/${name}/${name}.twig`)).then(res => res.text())
}
async function loadPreprocess(name) {
	const dynamicModule = await import(browser.runtime.getURL(`templates/${name}/${name}.preprocess.mjs`))
	return dynamicModule.default
}
async function loadPostprocess(name) {
	const dynamicModule = await import(browser.runtime.getURL(`templates/${name}/${name}.postprocess.mjs`))
	return dynamicModule.default
}

const templateDefinition = [
	{
		id: 'main',
		preprocess: true,
		style: true,
	},
	{
		id: 'ensign',
		style: true,
		preprocess: true,
	},
	{
		id: 'remark',
		postprocess: true,
		preprocess: true,
		style: true,
	},
	{
		id: 'register',
		style: true,
	},
	{
		id: 'chart',
		style: true,
	},
	{
		id: 'snack',
		preprocess: true,
	},
	{
		id: 'annote',
		style: true,
	},
	{
		id: 'amount',
		preprocess: true,
	},
	{
		id: 'thing',
		postprocess: true,
		preprocess: true,
	},
	{
		id: 'thin',
		postprocess: true,
		preprocess: true,
	},
	{
		preprocess: true,
		id: 'tempus',
	},
	{
		id: 'pic',
		style: true,
	},
	{
		id: 'play',
	},
	{
		id: 'watch',
	},
	{
		id: 'title',
	},
	{
		preprocess: true,
		id: 'medius',
	},
	{
		preprocess: true,
		id: 'earl',
	},
	{
		preprocess: true,
		style: true,
		id: 'map',
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
		.replace(/{%(-)?\s+include '([^']+)'\s(-)?%}/gm, `{{$1 include_$2({}, _context) $3}}`)
		.replace(/{%(-)?\s+include '([^']+)'\s+with\s+([^%]+)\s(-)?%}/gm, `{{$1 include_$2($3, _context) $4}}`)
	return item
}));