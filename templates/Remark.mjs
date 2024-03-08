import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Snack from './Snack.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

class Remark extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/remark.css'));
  }

  render({ claim, manager }) {
    const objects = [];
    for (const object of claim) {
      objects.push(object);
    }
    const verb = claim[0].mainsnak.property;

    return html`
      <dl class="remark remark--inline" id="{{ verb }}">
        <dt class="remark__verb">
          <${Thin} id=${verb} manager=${manager} />
        </dt>
        ${objects.map(
          object => html`
            <dd id="${object.id}" class="remark__objects">
              <div class="remark__object">
                <div class="remark__object__main">
                  <${Snack} mainsnak=${object.mainsnak} manager=${manager} />
                </div>
                ${object.qualifiers &&
                html`
                  <div class="remark__qualifiers">
                    <${Snack}
                      qualifiers=${object.qualifiers}
                      manager=${manager} />
                  </div>
                `}
              </div>
            </dd>
          `,
        )}
      </dl>
    `;
  }
}

export default Remark;
