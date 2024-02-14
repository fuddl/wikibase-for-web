import { requreStylesheet } from '../../modules/requreStylesheet.mjs'

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
		postprocess: true,
		id: 'spot',
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
		id: 'thi',
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

Twig.extendFunction('debug', function(args) {
	return console.debug(args)
});


class templateRenderer {
	constructor(manager) {
		this.manager = manager
		this.rootTemplate = `{{ include_main(_context) }}`
	}
 	getDeepestContext (obj) {
 		return obj?.context ? this.getDeepestContext(obj.context) : obj
 	}
	async init () {	
		this.templates = await Promise.all(templateDefinition.map(async (item) => {
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
		}))
		this.templates.forEach((template) => {
			Twig.extendFunction(`include_${template.id}`, (args, context) => {
				const subTemplate = Twig.twig({
					data: template.template,
				})
				const processedArgs = structuredClone(args)
				if (template.preprocess) {
					try {
						template.preprocess({
							vars: processedArgs, 
							context: this.getDeepestContext(context),
							manager: this.manager,
						})
					} catch (e) {
						console.error(e)
					}
				}
				if (template.style) {
					template.style.forEach((path) => { requreStylesheet(path) })
				}
				return subTemplate.render({ ...processedArgs, context: context })
			})
		})
	}
	applyPostprocess = async (dom) => {
		await Promise.all(this.templates.map((template) => {
			if (!template.postprocess) {
				return
			}
			dom.querySelectorAll(`.${template.id}`).forEach(async (element) => {
				const instance = element.closest('[data-instance]').dataset.instance
				if (!element?.dataset.postprocessed) {
					await template.postprocess({
						element: element, 
						manager: this.manager,
						instance: this.manager.getInstance(instance),
						addEvents: !('eventsAdded' in element),
					})
					element.eventsAdded = true
					element.dataset.postprocessed = true
				}
			})
		}))
	}
	renderRoot(data) {
		const rootTemplat = Twig.twig({ data: this.rootTemplate })
		return rootTemplat.render(data)
	}
}

export default templateRenderer
