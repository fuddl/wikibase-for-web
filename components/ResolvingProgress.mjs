import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Wait from './Wait.mjs';
import Thing from './Thing.mjs';
import Spinner from './Spinner.mjs';

const html = htm.bind(h);

const ResolvingProgress = ({ progress, manager }) => {
	if (!progress) return null;

	requireStylesheet(browser.runtime.getURL('/components/resolving-progress.css'));

	const { resolvers, wikibases, finished, results, applies } = progress;

	const handleResultClick = async (e, id) => {
		e.preventDefault();
		await browser.runtime.sendMessage({
			type: 'request_navigate',
			entity: id,
		});
	};

	return html`<div class="resolving-progress">
		<${Wait} status=${browser.i18n.getMessage('resolving_content')} />
		<ul class="resolving-progress__list">
			${wikibases
			.map(wikibaseId => {
				const wikibase = manager.wikibases[wikibaseId];
				const resolverInfo = resolvers.map(resolverId => {
					const key = `${resolverId}:${wikibaseId}`;
					const isFinished = finished.includes(key);
					const resolverResults = results[key] || [];
					const doesApply = applies[key];
					const hasResults = resolverResults.length > 0;

					let icon = html`<${Spinner} small />`;
					let statusClass = '';
					let priority = 1; // Default: still resolving

					if (isFinished) {
						if (!doesApply) {
							icon = '✗';
							statusClass = 'resolving-progress__resolver--not-applied';
							priority = 3;
						} else if (!hasResults) {
							icon = '➖';
							statusClass = 'resolving-progress__resolver--no-results';
							priority = 2;
						} else {
							icon = '✓';
							statusClass = 'resolving-progress__resolver--finished';
							priority = 0;
						}
					}

					return {
						id: resolverId,
						key,
						isFinished,
						resolverResults,
						hasResults,
						doesApply,
						icon,
						statusClass,
						priority,
					};
				});

				return {
					id: wikibaseId,
					name: wikibase.name,
					resolvers: resolverInfo,
				};
			})
			.filter(wb => {
				// Hide Wikibase if all its resolvers have finished and none applied
				return wb.resolvers.some(r => !r.isFinished || r.doesApply);
			})
			.map(wb => {
				return html`<li class="resolving-progress__wikibase">
					<h3 class="resolving-progress__wikibase-name">${wb.name}</h3>
					<ul class="resolving-progress__resolvers">
						${wb.resolvers
						.sort((a, b) => a.priority - b.priority)
						.map(resolver => {
							return html`<li class="resolving-progress__resolver ${resolver.statusClass}">
								<span class="resolving-progress__icon">${resolver.icon}</span>
								<span class="resolving-progress__name">${browser.i18n.getMessage(`resolver_${resolver.id}_name`) || resolver.id}</span>
								<div class="resolving-progress__description">${browser.i18n.getMessage(`resolver_${resolver.id}_desc`)}</div>
								${resolver.isFinished && resolver.hasResults && html`<div class="resolving-progress__results-header">${browser.i18n.getMessage('resolving_results')}</div><ul class="resolving-progress__results">
									${resolver.resolverResults.map(result => html`<li class="resolving-progress__result">
										<${Thing} id=${result.id} manager=${manager} onClick=${e => handleResultClick(e, `${wb.id}:${result.id}`)} />
									</li>`)}
								</ul>`}
							</li>`;
						})}
					</ul>
				</li>`;
			})}
		</ul>
	</div>`;
};

export default ResolvingProgress;
