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
	document.documentElement.lang = navigator.language;
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
			resolvingProgress: null,
			ignoredResolvers: [],
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
		if (message.type === 'resolving_started') {
			this.setState({
				resolvingProgress: {
					url: message.url,
					resolvers: message.resolvers,
					wikibases: message.wikibases,
					startTime: Date.now(),
					finished: [],
					results: {},
					applies: {},
					errors: {},
				},
				suggestions: null,
				entity: null,
				selectable: null,
				otherEntities: null,
			});
			return Promise.resolve('done');
		} else if (message.type === 'resolving_progress') {
			this.setState(prevState => {
				if (prevState.resolvingProgress?.url !== message.url) return null;
				const key = `${message.resolver}:${message.wikibase}`;
				if (prevState.resolvingProgress.finished.includes(key)) return null;
				const isError = message.status === 'error';
				return {
					resolvingProgress: {
						...prevState.resolvingProgress,
						finished: [...prevState.resolvingProgress.finished, key],
						results: {
							...prevState.resolvingProgress.results,
							[key]: message.results || [],
						},
						applies: {
							...prevState.resolvingProgress.applies,
							[key]: isError ? true : message.applies,
						},
						errors: {
							...prevState.resolvingProgress.errors,
							[key]: isError ? { message: message.error, code: message.errorCode } : null,
						},
					},
				};
			});
			return Promise.resolve('done');
		} else if (message.type === 'resolved') {
			let viewId = Date.now();
			this.setState({
				viewId: viewId,
				resolvingProgress: null,
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

	handleIgnoreResolver = key => {
		this.setState(prevState => {
			const ignored = [...(prevState.ignoredResolvers || []), key];
			const { resolvingProgress } = prevState;
			
			if (resolvingProgress) {
				const total = resolvingProgress.resolvers.length * resolvingProgress.wikibases.length;
				const finishedOrIgnored = new Set([...resolvingProgress.finished, ...ignored]);

				if (finishedOrIgnored.size >= total) {
					browser.runtime.sendMessage({ type: 'request_finish' });
				}
			}

			return { ignoredResolvers: ignored };
		});
	};

	render() {
		const {
			entity,
			suggestions,
			otherEntities,
			selectable,
			workbench,
			viewId,
			resolvingProgress,
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
			resolvingProgress=${resolvingProgress}
			onIgnore=${this.handleIgnoreResolver}
			manager=${manager} />`;
	}
}

render(html`<${Sidebar} />`, document.body);
