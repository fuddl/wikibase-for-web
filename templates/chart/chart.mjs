import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';
import Snack from '../snack/snack.mjs';
import Thin from '../thin/Thin.mjs';

const html = htm.bind(h);

class Chart extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/chart/chart.css'));
  }

  render({ claims, manager }) {
    return html`<table class="chart">
      ${claims &&
      claims.map(
        claim =>
          html` <tbody>
            <tr>
              ${claim.map(
                object =>
                  html`<th class="chart__verb" rowspan="${claim.length}">
                      <${Thin}
                        id=${object.mainsnak.property}
                        manager=${manager} />
                    </th>
                    <td class="chart__object">
                      <${Snack} ...${object} manager=${manager} />
                    </td>`,
              )}
            </tr>
          </tbody>`,
      )}
    </table>`;
  }
}

export default Chart;
