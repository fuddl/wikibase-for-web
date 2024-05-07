import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Thing from './Thing.mjs';
import Snack from './Snack.mjs';

const html = htm.bind(h);

class Refer extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/refer.css'));
  }
  render({ references, manager, wikibase }) {
    return html`<div class="refer">
      ${Object.entries(references)
        .sort((a, b) => a[1].number - b[1].number)
        .map(
          ([key, { number, reference }]) =>
            html`<dl id=${reference.hash} class="refer__item">
              <dt class="refer__number">${number}</dt>
              <dd class="refer__snaks">
                <dl>
                  ${Object.entries(reference.snaks).map(
                    ([key, snaks]) =>
                      html`<dt>
                          <${Thing}
                            id=${`${wikibase}:${key}`}
                            manager=${manager} />
                        </dt>
                        ${snaks.map(
                          snak =>
                            html`<dd class="refer__snak">
                              <${Snack} mainsnak=${snak} manager=${manager} />
                            </dd>`,
                        )}`,
                  )}
                </dl>
              </dd>
            </dl> `,
        )}
    </div>`;
  }
}

export default Refer;
