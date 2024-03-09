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
		this.state = { item: null }; // Initialize state
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
			if (organised.bestMatches.length > 0) {
				const currentEntity = await manager.add(organised.bestMatches[0].id);
				this.setState({
					suggestions:
						organised?.betterProps.length > 0 ? organised.betterProps : 0,
					entity: currentEntity,
					otherEntities: organised.otherMatches,
				});
			}
			return Promise.resolve('done');
		}
	};

	render() {
		const { entity, suggestions, otherEntities } = this.state;

		return entity
			? html`<${Main}
					entity=${entity}
					suggestions=${suggestions}
					otherEntities=${otherEntities}
					manager=${manager} />`
			: null;
	}
}

render(html`<${Sidebar} />`, document.body);
