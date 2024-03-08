import { h } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';
import Thing from '../thing/thing.mjs';
import Title from '../title/title.mjs';
import Tempus from '../tempus/tempus.mjs';
import Earl from '../earl/earl.mjs';
import Mediate from '../mediate/mediate.mjs';

const html = htm.bind(h);

const Snack = ({ mainsnak, qualifiers, manager }) => html`
  <div>
    ${(mainsnak.snaktype === 'value' &&
      (function () {
        switch (mainsnak.datatype) {
          case 'external-id':
            return html`<${Spot}
              value=${mainsnak.datavalue.value}
              property=${mainsnak.property} />`;
          case 'wikibase-item':
          case 'wikibase-property':
            return html`<${Thing}
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
            return html`<${Amount} ...${mainsnak.datavalue.value} />`;
          case 'globe-coordinate':
            return html`<${Map} ...${mainsnak.datavalue.value} />`;
          default:
            return html`<span>
              ${`Unsupported datatype ${mainsnak.datatype}`}
            </span>`;
        }
      })()) ||
    (mainsnak.snaktype &&
      html`<em
        >${['novalue', 'somevalue'].includes(mainsnak.snaktype)
          ? browser.i18n.getMessage('no_value')
          : browser.i18n.getMessage('unknown')}</em
      >`)}
    ${qualifiers && html`<${Annote} qualifiers=${qualifiers} />`}
  </div>
`;

export default Snack;
