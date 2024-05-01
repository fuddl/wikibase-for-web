import { h } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';

import Amount from './Amount.mjs';
import Annote from './Annote.mjs';
import Earl from './Earl.mjs';
import Map from './Map.mjs';
import Mediate from './Mediate.mjs';
import Spot from './Spot.mjs';
import Tempus from './Tempus.mjs';
import Thing from './Thing.mjs';
import Title from './Title.mjs';
import Word from './Word.mjs';

const html = htm.bind(h);

const Snack = ({ mainsnak, qualifiers, manager }) => html`
  ${(mainsnak?.snaktype === 'value' &&
    (function () {
      switch (mainsnak.datatype) {
        case 'external-id':
          return html`<${Spot}
            value=${mainsnak.datavalue.value}
            property=${mainsnak.property}
            manager=${manager} />`;
        case 'wikibase-item':
        case 'wikibase-property':
          return html`<${Thing}
            ...${mainsnak.datavalue.value}
            manager=${manager} />`;
        case 'wikibase-lexeme':
        case 'wikibase-form':
        case 'wikibase-sense':
          return html`<${Word}
            ...${mainsnak.datavalue.value}
            manager=${manager} />`;
        case 'time':
          return html`<${Tempus}
            ...${mainsnak.datavalue.value}
            manager=${manager} />`;
        case 'url':
          return html`<${Earl} ...${mainsnak.datavalue} />`;
        case 'string':
          return html`<span>${mainsnak.datavalue.value}</span>`;
        case 'localMedia':
        case 'commonsMedia':
          return html`<${Mediate} ...${mainsnak} manager=${manager} />`;
        case 'monolingualtext':
          return html`<${Title} ...${mainsnak.datavalue.value} />`;
        case 'quantity':
          return html`<${Amount}
            ...${mainsnak.datavalue.value}
            manager=${manager} />`;
        case 'globe-coordinate':
          return html`<${Map} ...${mainsnak.datavalue.value} />`;
        default:
          return html`<span>
            ${`Unsupported datatype ${mainsnak.datatype}`}
          </span>`;
      }
    })()) ||
  (mainsnak?.snaktype &&
    html`<em
      >${['novalue', 'somevalue'].includes(mainsnak.snaktype)
        ? browser.i18n.getMessage('no_value')
        : browser.i18n.getMessage('unknown')}</em
    >`)}
  ${qualifiers &&
  html`<${Annote} qualifiers=${qualifiers} manager=${manager} />`}
`;

export default Snack;
