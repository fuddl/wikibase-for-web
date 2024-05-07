import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import Thin from './Thin.mjs';

const html = htm.bind(h);

class Tempus extends Component {
  render({ time, precision, calendarmodel, manager }) {
    const datetime = time.replace(/^(\+|\-)/, '');

    let localised = '';
    const negative = time.startsWith('-');

    if (precision > 10) {
      const date = new Date(datetime);
      // display dates as iso for now
      localised = date.toISOString().substring(0, 10);
      //localised = date.toLocaleDateString(Intl.DateTimeFormat());
    } else if (precision == 10) {
      const year = parseInt(time.substring(1, 6));
      const monthNumber = parseInt(time.substring(6, 8));
      const date = new Date(datetime);
      const monthNames = [
        browser.i18n.getMessage('month_1'),
        browser.i18n.getMessage('month_2'),
        browser.i18n.getMessage('month_3'),
        browser.i18n.getMessage('month_4'),
        browser.i18n.getMessage('month_5'),
        browser.i18n.getMessage('month_6'),
        browser.i18n.getMessage('month_7'),
        browser.i18n.getMessage('month_8'),
        browser.i18n.getMessage('month_9'),
        browser.i18n.getMessage('month_10'),
        browser.i18n.getMessage('month_11'),
        browser.i18n.getMessage('month_12'),
      ];
      const monthName = monthNames[monthNumber + 1];
      localised = browser.i18n.getMessage('date_month', [
        monthName,
        monthNumber,
        year,
      ]);
    } else if (precision == 9) {
      const year = parseInt(time.substring(1, 6));
      localised = browser.i18n.getMessage('date_year', [year]);
    } else if (precision == 8) {
      const decade = `${parseInt(time.substring(1, 4))}`.padEnd(4, '0');
      const decadeOrdinal = `${parseInt(decade) + 10}`.slice(0, -1);
      localised = browser.i18n.getMessage('date_decade', [
        decadeOrdinal,
        decade,
      ]);
    } else if (precision == 7) {
      const century = parseInt(time.substring(1, 3));
      const centuryOrdinal = century + 1;
      localised = browser.i18n.getMessage('date_cenury', [
        centuryOrdinal,
        century,
      ]);
    } else if (precision == 6) {
      const millenia = parseInt(time.substring(1, 2));
      const milleniaOrdinal = millenia + 1;
      localised = browser.i18n.getMessage('date_millenium', [
        milleniaOrdinal,
        millenia,
      ]);
    } else if (precision < 6) {
      const year = parseInt(time.substring(1, 6));
      const deltas = {
        5: 10000,
        4: 100000,
        3: 1000000,
        2: 10000000,
        1: 100000000,
      };
      const delta = deltas[precision];
      const lowerBound = year - delta / 2;
      const upperBound = year + delta / 2;
      const deltaFormated = new Intl.NumberFormat().format(
        parseFloat(delta / 2),
      );
      localised = browser.i18n.getMessage('date_year_range', [
        year,
        lowerBound,
        upperBound,
        deltaFormated,
      ]);
    }
    if (negative && precision > 5) {
      localised = browser.i18n.getMessage('date_bce', [localised]);
    }

    return html`<time class="tempus" datetime="${'datetime'}">
      <span class="tempus__main">${localised}</span>
      ${calendarmodel &&
      calendarmodel !== 'wikidata:Q1985727' &&
      html`<br /><small
          ><${Thin} id=${calendarmodel} manager=${manager}
        /></small>`}
    </time>`;
  }
}

export default Tempus;
