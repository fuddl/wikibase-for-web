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
	return html`
		<dl class="grasp">
			${senses.map(sense => {
				return html`<dt class="grasp__id" key=${`${sense.id}-id`}>
						${sense.id.replace(/.+(S\d+)$/, '$1')}
					</dt>
					<dd class="grasp__gloss" key=${`${sense.id}-gloss`}>
						<${Gloss} sense=${sense} manager=${manager} />
					</dd>`;
			})}
		</dl>
	`;
}

export default Grasp;
