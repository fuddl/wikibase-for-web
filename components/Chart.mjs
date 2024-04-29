import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Snack from './Snack.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

class Chart extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/chart.css'));
  }

  render({ claims, manager }) {
    return html`<table class="chart">
      ${claims &&
      claims.map(
        claim =>
          html`<tbody>
            ${claim.map(
              (object, index) =>
                html`<tr key=${object.id}>
                  ${index === 0 &&
                  html`<th class="chart__verb" rowspan="${claim.length}">
                    <${Thin}
                      id=${object.mainsnak.property}
                      manager=${manager} />
                  </th>`}
                  <td class="chart__object">
                    <${Snack} ...${object} manager=${manager} />
                  </td>
                </tr>`,
            )}
          </tbody>`,
      )}
    </table>`;
  }
}

export default Chart;
