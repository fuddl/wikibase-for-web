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
		style: true,
		preprocess: true,
	},
	{
		id: 'ensign',
		style: true,
		preprocess: true,
	},
	{
		id: 'entity',
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
		id: 'pick',
		preprocess: true,
		postprocess: true,
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
	getInstance(obj) {
		// Base case: if the current object is null or undefined, return false
		if (!obj) return false

		// If the current object has a key named 'instance', return the current object
		if ('instance' in obj) return obj.instance

		// Recursively search in the 'context' property if it exists
		if (obj.context) return this.getInstance(obj.context)

		// If none of the conditions are met, return false indicating 'instance' was not found
		return false
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
						const contextInstance = this.getInstance(context)
						template.preprocess({
							vars: processedArgs, 
							instance: contextInstance ? this.manager.getInstance(contextInstance) : false,
							context: context,
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
				const instanceWrapper = element.closest('[data-instance]')
				const instance = instanceWrapper?.dataset?.instance
				if (!element?.dataset.postprocessed) {
					await template.postprocess({
						element: element, 
						manager: this.manager,
						instance: instance ? this.manager.getInstance(instance) : null,
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
