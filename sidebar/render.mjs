import { DiffDOM } from '../node_modules/diff-dom/dist/module.js'
import templateRenderer from '../templates/index.mjs'
import { requreStylesheet } from '../../modules/requreStylesheet.mjs'

const renderer = new templateRenderer()
await renderer.init(manager)

async function render(manager, state) {
	
	requreStylesheet(browser.runtime.getURL('/node_modules/normalize.css/normalize.css'))
	requreStylesheet(browser.runtime.getURL('/style/index.css'))

	const rendered = renderer.renderRoot({
		entities: manager.entities,
		state: state,
	})

	const dd = new DiffDOM()
	const diff = dd.diff(document.body, `<body>${rendered}</body>`)
	
	dd.apply(document.body, diff)
	
	document.documentElement.style.scrollbarWidth = 'none'

	await renderer.applyPostprocess(document.body, state)

	document.addEventListener('scroll', () => {
		document.documentElement.style.scrollbarWidth = 'thin'
	})
}

export { render }