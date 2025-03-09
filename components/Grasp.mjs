import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import Thing from './Thing.mjs';
import Gloss from './Gloss.mjs';

const html = htm.bind(h);

function Grasp({ senses, manager }) {
	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/grasp.css'));
	}, []);

	const hyperProp =
		'hyperonym' in manager.wikibase.props
			? manager.wikibase.props.hyperonym
			: false;

	const senseById = {};
	senses.forEach(sense => {
		senseById[sense.id] = { ...sense, children: [] };
	});

	const topSenses = [];
	senses.forEach(sense => {
		let hyperonymId = false;
		if (hyperProp in sense.claims) {
			hyperonymId = sense.claims[hyperProp]
				.map(claim => claim.mainsnak?.datavalue?.value?.id)
				.find(Boolean);
		}
		if (hyperonymId && senseById[hyperonymId]) {
			senseById[hyperonymId].children.push(senseById[sense.id]);
		} else {
			topSenses.push(senseById[sense.id]);
		}
	});

	function renderSense(sense) {
		return html`
			<dt class="grasp__id" key=${`${sense.id}-id`}>
				${sense.id.replace(/.+(S\d+)$/, '$1')}
			</dt>
			<dd class="grasp__gloss" key=${`${sense.id}-gloss`}>
				<${Gloss} sense=${sense} manager=${manager} />
			</dd>
			${sense.children.length > 0
				? html`
						<dd class="grasp__subsenses">
							<dl class="grasp">
								${sense.children.map(child => renderSense(child))}
							</dl>
						</dd>
					`
				: null}
		`;
	}

	return html`
		<dl class="grasp">${topSenses.map(sense => renderSense(sense))}</dl>
	`;
}

export default Grasp;
