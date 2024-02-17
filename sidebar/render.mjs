import { DiffDOM } from '../node_modules/diff-dom/dist/module.js'
import templateRenderer from '../templates/index.mjs'
import { requreStylesheet } from '../../modules/requreStylesheet.mjs'

async function render(manager) {

	const renderer = new templateRenderer(manager)
	await renderer.init()
	requreStylesheet(browser.runtime.getURL('/node_modules/normalize.css/normalize.css'))
	requreStylesheet(browser.runtime.getURL('/style/index.css'))

	const rendered = renderer.renderRoot({
		entities: manager.entities,
		activity: manager.activity,
	})

	const dd = new DiffDOM()
	const diff = dd.diff(document.body, `<body>${rendered}</body>`)
	
	dd.apply(document.body, diff)
	
	document.documentElement.style.scrollbarWidth = 'none'

	await renderer.applyPostprocess(document.body, manager)

	document.addEventListener('scroll', () => {
		document.documentElement.style.scrollbarWidth = 'thin'
	})
}

export { render }