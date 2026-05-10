import { h } from '../importmap/preact/src/index.js';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Wait from './Wait.mjs';
import Thing from './Thing.mjs';
import Spinner from './Spinner.mjs';

const html = htm.bind(h);

const ResolvingProgress = ({ progress, manager, onIgnore }) => {
	if (!progress) return null;

	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, []);

	requireStylesheet(browser.runtime.getURL('/components/resolving-progress.css'));

	const handleDisablePermanently = (e, id) => {
		e.preventDefault();
		browser.tabs.create({
			url: browser.runtime.getURL(`options/index.html#${id}`)
		});
	};

	const { resolvers, wikibases, finished, results, applies, errors, startTime } = progress;

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
					const error = errors[key];
					const duration = now - startTime;
					const isSlow = !isFinished && duration > 8000;

					let icon = html`<${Spinner} small />`;
					let statusClass = '';
					let priority = 1; // Default: still resolving

					if (isFinished) {
						if (error && error.code !== 429) {
							icon = '⚠️';
							statusClass = 'resolving-progress__resolver--error';
						} else if (error && error.code === 429) {
							statusClass = 'resolving-progress__resolver--error';
						} else if (!doesApply) {
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
						error,
						isSlow,
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
								${(resolver.error || resolver.isSlow) && html`<div class="resolving-progress__error">
									<div class="resolving-progress__error-message">
										${resolver.isSlow
											? browser.i18n.getMessage('resolving_taking_long')
											: (resolver.error.code === 429
												? browser.i18n.getMessage('resolving_rate_limit')
												: `${browser.i18n.getMessage('resolving_error_prefix')}: ${resolver.error.message}`)}
									</div>
									<button class="resolving-progress__ignore-button" onClick=${() => onIgnore(resolver.key)}>
										${browser.i18n.getMessage('resolving_ignore_button')}
									</button>
									${' '}
									${browser.i18n.getMessage('resolving_or')}
									${' '}
									<a href="#" onClick=${(e) => handleDisablePermanently(e, resolver.id)}>
										${browser.i18n.getMessage('resolving_disable_permanently')}
									</a>
								</div>`}
								${resolver.isFinished && resolver.hasResults && html`<div class="resolving-progress__results">${browser.i18n.getMessage('resolving_results')}<ul class="resolving-progress__result-list">
									${resolver.resolverResults.map(result => html`<li>
										<${Thing} id=${result.id} manager=${manager} onClick=${e => handleResultClick(e, `${wb.id}:${result.id}`)} />
									</li>`)}
								</ul></div>`}
							</li>`;
						})}
					</ul>
				</li>`;
			})}
		</ul>
	</div>`;
};

export default ResolvingProgress;
