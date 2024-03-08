import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';
import { objectGetFirst } from '../../modules/objectGetFirst.mjs';
import Snack from '../snack/snack.mjs';
import Thin from '../thin/thin.mjs';

const html = htm.bind(h);

class Annote extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/annote/annote.css'));
  }

  render({ qualifiers, manager }) {
    return html`
      <dl class="annote">
        ${Object.entries(qualifiers).map(entry => {
          const [id, qualifier] = entry;
          return qualifier.map(
            (tuple, index) => html`
              ${index === 0
                ? html`
                    <dt class="annote__verb" key=${index}>
                      <${Thin} id=${tuple.property} manager=${manager} />
                    </dt>
                  `
                : null}
              <dd class="annote__object">
                <${Snack} mainsnak=${tuple} manager=${manager} />
              </dd>
            `,
          );
        })}
      </dl>
    `;
  }
}

export default Annote;
