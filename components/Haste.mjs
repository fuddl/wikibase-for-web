import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Snack from './Snack.mjs';
import Thing from './Thing.mjs';

const html = htm.bind(h);

class Haste extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/haste.css'));
  }

  render({ claims, manager }) {
    return html`<ul class="haste">
      ${claims &&
      claims.map(
        claim =>
          html`<li class="haste__item" key="{claim[0].id}">
            <img class="haste__icon" src=${claim[0].icon[0]} loading="lazy" />
            <div class="haste__links">
              ${claim.map(
                object =>
                  html`<div class="haste__link">
                    /<${Snack}
                      ...${object}
                      qualifiers=${false}
                      manager=${manager} /><br />
                  </div>`,
              )}
            </div>
          </li>`,
      )}
    </ul>`;
  }
}

export default Haste;
