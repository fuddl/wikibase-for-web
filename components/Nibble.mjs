import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Amount from './Amount.mjs';
import Annote from './Annote.mjs';
import Appoint from './Appoint.mjs';
import Choose from './Choose.mjs';
import Map from './Map.mjs';
import Mediate from './Mediate.mjs';
import Spot from './Spot.mjs';
import Thin from './Thin.mjs';
import Thing from './Thing.mjs';
import Type from './Type.mjs';

import Designate from './Designate.mjs';

const html = htm.bind(h);

class Nibble extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/nibble.css'));
  }

  render({
    datavalue,
    datatype,
    subject,
    manager,
    onValueChange,
    name,
    onUpdateReference,
    onAddJobs,
  }) {
    return html`
      <fieldset class="nibble">
        <input name="${name}.datatype" value=${datatype} type="hidden" />
        <input name="${name}.snaktype" value="value" type="hidden" />
        ${[
          'external-id',
          'commonsMedia',
          'commonsMedia',
          'string',
          'url',
        ].includes(datatype)
          ? html`<input
              value="${datavalue.type}"
              name="${name}.datavalue.type"
              type="hidden" />`
          : html`<input
              value="${datatype}"
              name="${name}.datavalue.type"
              type="hidden" />`}
        ${(() => {
          switch (datatype) {
            case 'external-id':
              return html`<${Type}
                value=${datavalue.value}
                type="text"
                required
                name="${name}.datavalue.value"
                onValueChange=${onValueChange} />`;
            case 'wikibase-form':
            case 'wikibase-item':
            case 'wikibase-lexeme':
            case 'wikibase-property':
            case 'wikibase-sense':
              return html` <${Choose}
                manager=${manager}
                value=${datavalue?.value?.id.replace(/^\w+\:/, '')}
                wikibase=${manager.wikibase.id}
                name="${name}.datavalue.value.id"
                subject=${subject}
                type=${{
                  'wikibase-item': 'item',
                  'wikibase-property': 'property',
                  'wikibase-lexeme': 'lexeme',
                  'wikibase-sense': 'sense',
                  'wikibase-form': 'form',
                }[datatype]}
                onValueChange="${newValue => {
                  onValueChange(newValue);
                }}"
                onAddJobs=${value => {
                  if (onAddJobs) {
                    onAddJobs(value);
                  }
                }}
                onUpdateReference=${onUpdateReference} />`;
            case 'time':
              return html`<${Appoint}
                name=${name}
                datavalue=${datavalue}
                onUpdateReference=${onUpdateReference}
                manager=${manager}
                wikibase=${manager.wikibase.id}
                onValueChange=${onValueChange} />`;
            case 'url':
              return html`<${Type}
                value=${datavalue.value}
                type="url"
                name="${name}.datavalue.value"
                onValueChange=${onValueChange} />`;
            case 'string':
              return html`<${Type}
                value=${datavalue.value}
                type="text"
                name="${name}.datavalue.value"
                onValueChange=${onValueChange} />`;
            case 'localMedia':
            case 'commonsMedia':
              return html`<${Mediate} ...${mainsnak} manager=${manager} />`;
            case 'monolingualtext':
              return html`<${Designate}
                value=${datavalue?.value}
                name="${name}.datavalue"
                wikibase=${manager.wikibase.id}
                subject=${subject}
                required=${true}
                onValueChange=${onValueChange}
                onAddJobs=${value => {
                  if (onAddJobs) {
                    onAddJobs(value);
                  }
                }}
                onUpdateReference=${onUpdateReference}
                manager=${manager} />`;
            case 'quantity':
              return html`<div class="nibble__line">
                  <${Type}
                    value=${datavalue.value.amount.replace(/^\+/, '')}
                    type="number"
                    proxyName="${name}.datavalue.value.amount"
                    onValueChange=${newValue => {
                      newValue.value = newValue.value.replace(/^(\d)/, '+$1');
                      onValueChange(newValue);
                    }} />
                  ${datavalue.value.unit !== '1' &&
                  html`<${Thin}
                    id=${datavalue.value.unit}
                    unit=${true}
                    manager=${manager} />`}
                </div>
                <input
                  name="${name}.datavalue.value.amount"
                  value="${datavalue.value.amount}"
                  type="hidden" />
                ${/* @todo this should have autocomplete or select */ ''}
                <${Type}
                  value=${datavalue.value.unit === '1'
                    ? datavalue.value.unit
                    : manager.urlFromIdNonSecure(datavalue.value.unit)}
                  type="hidden"
                  name="${name}.datavalue.value.unit"
                  onValueChange=${onValueChange} />`;
            case 'globe-coordinate':
              return html`<div class="nibble__line">
                  <${Type}
                    value=${datavalue.value.latitude}
                    type="number"
                    name="${name}.datavalue.value.latitude"
                    step="any"
                    min="-90"
                    max="90"
                    onValueChange=${onValueChange} />
                  /
                  <${Type}
                    value=${datavalue.value.longitude}
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    name="${name}.datavalue.value.longitude"
                    onValueChange=${onValueChange} />
                  ±
                  <${Type}
                    value=${datavalue.value.precision}
                    type="number"
                    dataType="float"
                    size="1"
                    min="1"
                    max="10"
                    name="${name}.datavalue.value.precision"
                    onValueChange=${onValueChange} />
                </div>
                <${Type}
                  value=${datavalue.value.globe}
                  type="hidden"
                  name="${name}.datavalue.value.globe"
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
