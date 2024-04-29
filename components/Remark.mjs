import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Snack from './Snack.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

class Remark extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/remark.css'));
  }

  render({ claim, manager, references }) {
    const objects = [];
    for (const object of claim) {
      objects.push(object);
    }
    const verb = claim[0].mainsnak.property;

    return html`
      <dl class="remark remark--inline">
        <dt class="remark__verb">
          <${Thin} id=${verb} manager=${manager} />
        </dt>
        ${objects.map(
          object => html`
            <dd id="${object.id}" class="remark__objects">
              <div class="remark__object">
                <div class="remark__object__main">
                  <${Snack} mainsnak=${object.mainsnak} manager=${manager} />
                  ${object?.references &&
                  html` <sup>
                    ${object.references.map(
                      (reference, index) =>
                        html`<a href="#${reference.hash}"
                            >${references[reference.hash].number}</a
                          >${index < object.references.length - 1 ? '/' : ''}`,
                    )}</sup
                  >`}
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
