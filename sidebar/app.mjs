import htm from '../importmap/htm/src/index.mjs';
import { h, render, Component } from '../importmap/preact/src/index.js';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';
import { organiseView } from './organise-view.js';
import Main from '../components/Main.mjs';
import WikiBaseEntityManager from '../modules/WikiBaseEntityManager.mjs';
import { DesignatorRefresher } from '../modules/DesignatorRefresher.mjs';

const html = htm.bind(h);
const manager = new WikiBaseEntityManager({
	languages: navigator.languages.map(lang => lang.toLowerCase()),
});

// Start the idle refresher — it will silently update stale cached designators
// during quiet periods without interfering with user-triggered requests.
const designatorRefresher = new DesignatorRefresher(manager);
designatorRefresher.start();

// Notify the refresher whenever the manager fetches a designator so it can
// back off during active usage.
const _origFetchDesignators = manager.fetchDesignators.bind(manager);
manager.fetchDesignators = async function (id) {
	designatorRefresher.notifyActivity();
	return _origFetchDesignators(id);
};

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
			displayPriority: 'high',
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
			const incomingPriority = message.priority ?? 'high';

			// Determine the best-match entity id from candidates without fully resolving yet
			const organised = await organiseView(message, manager);
			const incomingEntityId = organised?.bestMatches?.[0]?.id ?? null;

			// Priority gate: a low-priority update for a *different* entity is dropped
			// when the sidebar was last populated by a high-priority source.
			const isSameEntity = incomingEntityId && this.state.entity?.id === incomingEntityId;
			if (
				incomingPriority === 'low' &&
				this.state.displayPriority === 'high' &&
				!isSameEntity
			) {
				return Promise.resolve('done');
			}

			let viewId = Date.now();
			this.setState({
				viewId: viewId,
				resolvingProgress: null,
			});

			const currentEntity = incomingEntityId
				? await manager.add(incomingEntityId)
				: null;
			this.setState({
				suggestions:
					organised?.betterProps.length > 0 ? organised.betterProps : 0,
				entity: organised.bestMatches.length === 1 ? currentEntity : null,
				selectable:
					organised.bestMatches.length > 1 ? organised.bestMatches : null,
				otherEntities: organised.otherMatches,
				displayPriority: incomingPriority,
			});
			scrollToTopInstantly();
			return Promise.resolve('done');
		} else if (message.type === 'update_entity') {
			const updatedIsCurrent = this.state.entity?.id === message.entity;
			const isCurrentJob = message?.jobId == this.state.viewId;
			const incomingPriority = message.priority ?? 'high';

			// Don't replace a high-priority navigation view with a different entity
			// if this update carries a lower priority
			const wouldChangeEntity = !updatedIsCurrent;
			if (wouldChangeEntity && incomingPriority === 'low' && this.state.displayPriority === 'high') {
				return Promise.resolve('done');
			}

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
		} else if (message.type === 'execute_context_edit') {
			if (typeof window.lastRightClickedEditAction === 'function') {
				window.lastRightClickedEditAction();
			}
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
