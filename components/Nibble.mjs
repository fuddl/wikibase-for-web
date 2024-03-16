import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Amount from './Amount.mjs';
import Annote from './Annote.mjs';
import Type from './Type.mjs';
import Map from './Map.mjs';
import Mediate from './Mediate.mjs';
import Spot from './Spot.mjs';
import Tempus from './Tempus.mjs';
import Thing from './Thing.mjs';
import Title from './Title.mjs';

const html = htm.bind(h);

class Nibble extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/nibble.css'));
  }

  render({ datavalue, datatype, manager, onValueChange, name }) {
    return html`
      <fieldset class="nibble">
        ${['external-id', 'commonsMedia', 'commonsMedia', 'string'].includes(
          datatype,
        )
          ? html`<input value="${datavalue.type}" type="hidden" />`
          : null}
        ${(() => {
          switch (datatype) {
            case 'external-id':
              return html`<${Type}
                value=${datavalue.value}
                type="text"
                name="${name}value"
                onValueChange=${onValueChange} />`;
            case 'wikibase-item':
            case 'wikibase-property':
              return html` <${Type}
                value=${datavalue.value.id.replace(/^\w+\:/, '')}
                type="text"
                name="${name}[value]id"
                onValueChange=${newValue => {
                  const prefix = datavalue.value.id.replace(/\:\w+$/, '');
                  newValue.value = `${prefix}:${newValue.value}`;
                  onValueChange(newValue);
                }} />`;
            case 'time':
              return html`<${Tempus}
                ...${datavalue.value}
                manager=${manager} />`;
            case 'url':
              return html`<${Type}
                value=${datavalue.value}
                type="url"
                name="${name}value"
                onValueChange=${onValueChange} />`;
            case 'string':
              return html`<span>${datavalue.value}</span>`;
            case 'localMedia':
            case 'commonsMedia':
              return html`<${Mediate} ...${mainsnak} manager=${manager} />`;
            case 'monolingualtext':
              return html`<${Title} ...${datavalue.value} />`;
            case 'quantity':
              return html` <input
                  name="${name}[value]amount"
                  value="${datavalue.value.amount}"
                  type="hidden" />
                <${Type}
                  value=${datavalue.value.amount.replace(/^\+/, '')}
                  type="number"
                  proxyName="${name}[value]amount"
                  onValueChange=${newValue => {
                    newValue.value = newValue.value.replace(/^(\d)/, '+$1');
                    onValueChange(newValue);
                  }} />`;
            case 'globe-coordinate':
              return html`<div class="nibble__line">
                  <${Type}
                    value=${datavalue.value.latitude}
                    type="number"
                    name="${name}[value]latitude"
                    step="0.00001"
                    min="-90"
                    max="+90"
                    onValueChange=${onValueChange} />
                  /
                  <${Type}
                    value=${datavalue.value.longitude}
                    type="number"
                    step="0.00001"
                    min="-180"
                    max="+180"
                    name="${name}[value]longitude"
                    onValueChange=${onValueChange} />
                  ±
                  <${Type}
                    value=${datavalue.value.precision}
                    type="number"
                    size="1"
                    min="2"
                    max="10"
                    name="${name}[value]precision"
                    onValueChange=${onValueChange} />
                </div>
                <${Type}
                  value=${datavalue.value.globe}
                  type="hidden"
                  name="${name}[value]globe"
                  disabled=${true}
                  onValueChange=${onValueChange} />`;
            default:
              return html`<span>${`Unsupported datatype ${datatype}`}</span>`;
          }
        })()}
      </fieldset>
    `;
  }
}

export default Nibble;
