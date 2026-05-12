import { h } from '../importmap/preact/src/index.js';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

const html = htm.bind(h);

const resolverIds = [
	'hash',
	'sitelinks',
	'url',
	'urlMatchPatternByDomain',
	'urlMatchPattern',
	'wikibase',
	'domain',
	'mediawikiCommonsFile',
	'error429',
	'error5xx',
];

const defaultDisabled = ['error429', 'error5xx'];

function Resolvers() {
	const [disabledResolvers, setDisabledResolvers] = useState(defaultDisabled);

	useEffect(() => {
		const loadData = async () => {
			const { disabledResolvers } = await browser.storage.sync.get('disabledResolvers');
			if (disabledResolvers !== undefined) {
				setDisabledResolvers(disabledResolvers);
			}
		};
		loadData();
	}, []);

	const handleToggle = async id => {
		const newDisabled = disabledResolvers.includes(id)
			? disabledResolvers.filter(d => d !== id)
			: [...disabledResolvers, id];

		setDisabledResolvers(newDisabled);
		await browser.storage.sync.set({ disabledResolvers: newDisabled });
	};

	return html`
		<fieldset>
			<legend>Resolvers</legend>
			<p>Enable or disable individual resolution methods. Disabling slow methods can improve performance if you don't need them.</p>

				${resolverIds.map(id => {
		const name = browser.i18n.getMessage(`resolver_${id}_name`) || id;
		const desc = browser.i18n.getMessage(`resolver_${id}_desc`);
		const isEnabled = !disabledResolvers.includes(id);
		const isTest = id.startsWith('error');

		return html`
						<div>
							<input
								type="checkbox"
								id=${id}
								checked=${isEnabled}
								onChange=${() => handleToggle(id)}
							/>
							<label for=${id}>${name}</label>
							<div style=${isTest ? 'color: #d33;' : ''}>${desc}</div>
						</div>
					`;
	})}

		</fieldset>
	`;
}

export default Resolvers;
