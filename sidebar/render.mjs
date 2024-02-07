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
	templates.forEach(function (template) {
		Twig.extendFunction(`include_${template.id}`, function(args, context) {
			const subTemplate = Twig.twig({ data: template.template })
			const processedArgs = structuredClone(args)
			if (template.preprocess) {
				template.preprocess(processedArgs, context)
			}
			if (template.style) {
				template.style.forEach((path) => { requreStylesheet(path) })
			}
			return subTemplate.render({ ...processedArgs, context: context })
		})
	})

	const applyPostprocess = async (dom, manager) => {
		await Promise.all(templates.map(async (template) => {
			if (template.postprocess) {
				dom.querySelectorAll(`.${template.id}`).forEach(async (element) => {
					const instanceName = element.closest('[data-instance]').dataset.instance
					if (!element?.postprocessed) {
						await template.postprocess(element, manager.getInstance(instanceName))
						element.postprocessed = true
					}
				})
			}
		}))
	}


	Twig.extendFunction('debug', function(args) {
		return console.debug(args)
	});

	const render = await manager.entities.map(async (entity) => {
		if (entity.active) {
			const mainTemplate = Twig.twig({
				data: templates.find((t) => t.id == 'main').template,
			});
			requreStylesheet(browser.runtime.getURL('/templates/main/main.css'))
			return mainTemplate.render({...entity.data, ...manager.extractIdComponents(entity.id)})
		} else {
			return ''
		}
	})
	const rendered = await Promise.all(render)
	const dd = new DiffDOM()
	const diff = dd.diff(document.body, `<body>${rendered.join('')}</body>`)
	dd.apply(document.body, diff)
	applyPostprocess(document.body, manager)
}

export { render }