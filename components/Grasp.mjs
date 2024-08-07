import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import Thing from './Thing.mjs';

const html = htm.bind(h);

function Grasp({ senses, manager }) {
	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/grasp.css'));
	}, []);
	return html`
		<dl class="grasp">
			${senses.map(sense => {
				const foo = getByUserLanguage(sense.glosses);
				const {
					language: lang,
					value: gloss,
					preferred,
				} = getByUserLanguage(sense.glosses);

				return html`<dt class="grasp__id">
						${sense.id.replace(/.+(S\d+)$/, '$1')}
					</dt>
					<dd class="grasp__gloss" lang="${lang}">
						${preferred
							? gloss
							: (() => {
									if (
										'itemForThisSense' in manager.wikibase.props &&
										manager.wikibase.props.itemForThisSense in sense.claims
									) {
										const items =
											sense.claims[manager.wikibase.props.itemForThisSense];
										return items.map(snak => {
											if (snak?.mainsnak?.datavalue?.value) {
												return html`<${Thing}
													...${snak.mainsnak.datavalue.value}
													manager=${manager} />`;
											}
										});
									}
									return gloss;
								})()}
					</dd>`;
			})}
		</dl>
	`;
}

export default Grasp;
