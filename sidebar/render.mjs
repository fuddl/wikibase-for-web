import { DiffDOM } from '../node_modules/diff-dom/dist/module.js'
import { Templates } from '../templates/index.mjs'

const requreStylesheet = (path) => {
	let exists = false
	for (const sheet of document.styleSheets) {
		if (sheet.href === path) {
			exists = true
		}
	}
	if (!exists) {
		let link = document.createElement('link')
		link.setAttribute('rel', "stylesheet")
		link.setAttribute('href', path)
		document.head.appendChild(link)
	}
}

async function render(manager) {

	requreStylesheet(browser.runtime.getURL('/node_modules/normalize.css/normalize.css'))

	const templates = await Templates

	const applyPostprocess = async (dom, manager) => {
		await Promise.all(templates.map(async (template) => {
			if (template.postprocess) {
				dom.querySelectorAll(`.${template.id}`).forEach(async (element) => {
					const instanceName = element.closest('[data-instance]').dataset.instance
					if (!element?.dataset.postprocessed) {
						await template.postprocess({
							element: element, 
							manager: manager,
							instance: manager.getInstance(instanceName),
							addEvents: !('eventsAdded' in element),
						})
						element.eventsAdded = true
						element.dataset.postprocessed = true
					}
				})
			}
		}))
	}


	Twig.extendFunction('debug', function(args) {
		return console.debug(args)
	});

	const entitiesForRender = manager.entities.filter((entity) => entity.active)

	const render = await entitiesForRender.map(async (entity) => {
		const mainTemplate = Twig.twig({
			data: `{{ include_main(_context) }}`,
		});
		const idComponents = manager.extractIdComponents(entity.id)
		templates.forEach(function (template) {
			Twig.extendFunction(`include_${template.id}`, function(args, context) {
				const subTemplate = Twig.twig({
					data: template.template,
				})
				const processedArgs = structuredClone(args)
				if (template.preprocess) {
					try {
						template.preprocess({
							vars: processedArgs, 
							context: context,
							instance: manager.getInstance(idComponents.instance),
							manager: manager,
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

		return mainTemplate.render({...entity.data, ...idComponents, selecting: entitiesForRender.length > 1})
	})

	const rendered = await Promise.all(render)
	const dd = new DiffDOM()
	const diff = dd.diff(document.body, `<body>${rendered.join('')}</body>`)
	
	dd.apply(document.body, diff)
	
	document.documentElement.style.scrollbarWidth = 'none'
	await applyPostprocess(document.body, manager)
	document.addEventListener('scroll', () => {
		document.documentElement.style.scrollbarWidth = 'thin'
	})
}

export { render }