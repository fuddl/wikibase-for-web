import htm from '../importmap/htm/src/index.mjs';
import { h, render, Component } from '../importmap/preact/src/index.js';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';
import { organiseView } from './organise-view.js';
import Main from '../components/Main.mjs';
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs';

const html = htm.bind(h);
const manager = new WikiBaseEntityManager({
	languages: navigator.languages.map(lang => lang.toLowerCase()),
});

if (manager.languages[0]) {
	document.documentElement.lang = manager.languages[0];
}

const scrollToTopInstantly = () => {
	// Force 'scroll-behavior: auto' to be applied
	document.documentElement.style.scrollBehavior = 'auto';

	// Force a sync layout so the style is applied
	document.documentElement.getBoundingClientRect();

	// Now do the scroll
	window.scrollTo(0, 0);

	// Optionally restore the old style
	document.documentElement.style.scrollBehavior = '';
};

class Sidebar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			viewId: 0,
			suggestions: null,
			entity: null,
			selectable: null,
			otherEntities: null,
			workbench: null,
		};
		requireStylesheet(
			browser.runtime.getURL('/node_modules/normalize.css/normalize.css'),
		);
		requireStylesheet(browser.runtime.getURL('/style/index.css'));
	}

	componentDidMount() {
		this.requestResolveIfNeeded();

		browser.runtime.onMessage.addListener(this.handleMessage);
	}

	componentWillUnmount() {
		browser.runtime.onMessage.removeListener(this.handleMessage);
	}

	requestResolveIfNeeded(prevState = this.state) {
		if (
			!this.state.entity &&
			!this.state.selectable &&
			!this.state.suggestions &&
			!this.state.otherEntities
		) {
			if (
				!prevState.entity &&
				!prevState.selectable &&
				!prevState.suggestions &&
				!prevState.otherEntities
			) {
				(async () => {
					await browser.runtime.sendMessage({
						type: 'request_resolve',
					});
				})();
			}
		}
	}

	handleMessage = async message => {
		if (message.type === 'resolved') {
			let viewId = Date.now();
			this.setState({
				viewId: viewId,
			});

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
			scrollToTopInstantly();
			return Promise.resolve('done');
		} else if (message.type === 'update_entity') {
			const updatedIsCurrent = this.state.entity?.id === message.entity;
			const isCurrentJob = message?.jobId == this.state.viewId;

			const shouldUpdate = isCurrentJob || updatedIsCurrent;

			if (shouldUpdate) {
				this.setState({
					entity: await manager.add(message.entity, false),
					suggestions: null,
					viewId: Date.now(),
				});
			}
			return Promise.resolve('done');
		} else if (message.type === 'navigate') {
			await this.setState({
				entity: await manager.add(message.entity, false),
				suggestions: null,
			});
			scrollToTopInstantly();
			return Promise.resolve('done');
		} else if (message.type === 'workbench') {
			await this.setState({
				workbench: message.workbench,
			});
			return Promise.resolve('done');
		}
	};

	render() {
		const {
			entity,
			suggestions,
			otherEntities,
			selectable,
			workbench,
			viewId,
		} = this.state;

		if (entity?.id) {
			manager.updateSidebarAction(entity.id.split(':')[0]);
		}

		return html`<${Main}
			viewId=${viewId}
			entity=${entity}
			selectable=${selectable}
			suggestions=${suggestions}
			otherEntities=${otherEntities}
			workbench=${workbench}
			manager=${manager} />`;
	}
}

render(html`<${Sidebar} />`, document.body);
