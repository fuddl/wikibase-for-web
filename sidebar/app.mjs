import htm from '../node_modules/htm/dist/htm.mjs';
import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
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
			const organised = organiseView(message);

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
		}
	};

	render() {
		const { entity, suggestions, otherEntities, selectable } = this.state;

		return html`<${Main}
			entity=${entity}
			selectable=${selectable}
			suggestions=${suggestions}
			otherEntities=${otherEntities}
			manager=${manager} />`;
	}
}

render(html`<${Sidebar} />`, document.body);
