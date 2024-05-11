import htm from '../importmap/htm/src/index.mjs';
import { h, render, Component } from '../importmap/preact/src/index.js';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';
import { organiseView } from './organise-view.js';
import Main from '../components/Main.mjs';
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs';

const html = htm.bind(h);
const manager = new WikiBaseEntityManager({
	languages: navigator.languages,
});

class Sidebar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			suggestions: null,
			entity: null,
			selectable: null,
			otherEntities: null,
		};
		requireStylesheet(
			browser.runtime.getURL('/node_modules/normalize.css/normalize.css'),
		);
		requireStylesheet(browser.runtime.getURL('/style/index.css'));
	}

	componentDidMount() {
		browser.runtime.onMessage.addListener(this.handleMessage);
	}

	componentWillUnmount() {
		browser.runtime.onMessage.removeListener(this.handleMessage);
	}

	handleMessage = async message => {
		if (message.type === 'resolved') {
			const organised = await organiseView(message, manager);

			const currentEntity = organised?.bestMatches?.[0]?.id
				? await manager.add(organised.bestMatches[0].id)
				: null;
			this.setState({
				suggestions:
					organised?.betterProps.length > 0 ? organised.betterProps : 0,
				entity: organised.bestMatches.length === 1 ? currentEntity : null,
				selectable:
					organised.bestMatches.length > 1 ? organised.bestMatches : null,
				otherEntities: organised.otherMatches,
			});
			return Promise.resolve('done');
		} else if (message.type === 'update_entity') {
			if (
				this.state.entity === null ||
				this.state.entity.id === message.entity ||
				this.state.suggestions.length > 0
			) {
				this.setState({
					entity: await manager.add(message.entity, false),
					suggestions: null,
				});
			}
			return Promise.resolve('done');
		} else if (message.type === 'text_selected') {
			const focussedElements =
				document.activeElement?.nodeName === 'INPUT' &&
				['text', 'search'].includes(document.activeElement.type)
					? [document.activeElement]
					: document.querySelectorAll('[data-focus="suggested"]');
			if (focussedElements) {
				focussedElements.forEach(element => {
					element.value = message.value;
					element.dispatchEvent(new Event('input'));
				});
			}
			return Promise.resolve('done');
		} else if (message.type === 'navigate') {
			document.documentElement.setAttribute('style', 'scroll-behavior: auto;');
			await this.setState({
				entity: await manager.add(message.entity, false),
				suggestions: null,
			});
			window.scrollTo(0, 0);
			document.documentElement.removeAttribute('style');
			return Promise.resolve('done');
		}
	};

	render() {
		const { entity, suggestions, otherEntities, selectable } = this.state;

		if (!entity && !selectable && !suggestions && !otherEntities) {
			(async () => {
				await browser.runtime.sendMessage({
					type: 'request_resolve',
				});
			})();
		}

		return html`<${Main}
			entity=${entity}
			selectable=${selectable}
			suggestions=${suggestions}
			otherEntities=${otherEntities}
			manager=${manager} />`;
	}
}

render(html`<${Sidebar} />`, document.body);
