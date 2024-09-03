import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Amount from './Amount.mjs';
import Annote from './Annote.mjs';
import Map from './Map.mjs';
import Mediate from './Mediate.mjs';
import Spot from './Spot.mjs';
import Thin from './Thin.mjs';
import Thing from './Thing.mjs';
import Type from './Type.mjs';
import Choose from './Choose.mjs';

import Designate from './Designate.mjs';

const html = htm.bind(h);

class Nibble extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/nibble.css'));
  }

  render({
    datavalue,
    datatype,
    manager,
    onValueChange,
    name,
    onUpdateReference,
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
            case 'wikibase-item':
            case 'wikibase-property':
              return html` <${Choose}
                manager=${manager}
                value=${datavalue?.value?.id.replace(/^\w+\:/, '')}
                wikibase=${manager.wikibase.id}
                name="${name}.datavalue.value.id"
                type=${datatype == 'wikibase-item' ? 'item' : 'property'}
                onValueChange=${newValue => {
                  onValueChange(newValue);
                }} />`;
            case 'time':
              return html`
                <input
                  name="${name}.datavalue.value.after"
                  data-type="int"
                  type="hidden"
                  value=${datavalue.value.after ?? 0} />
                <input
                  name="${name}.datavalue.value.before"
                  data-type="int"
                  type="hidden"
                  value=${datavalue.value.before ?? 0} />
                <input
                  name="${name}.datavalue.value.calendarmodel"
                  type="hidden"
                  value=${manager.urlFromIdNonSecure(
                    datavalue.value.calendarmodel,
                  )} />
                <input
                  name="${name}.datavalue.value.precision"
                  data-type="int"
                  type="hidden"
                  value=${datavalue.value.precision} />
                <input
                  name="${name}.datavalue.value.time"
                  type="hidden"
                  value=${datavalue.value.time} />
                <input
                  name="${name}.datavalue.value.timezone"
                  type="hidden"
                  data-type="int"
                  value=${datavalue.value.timezone} />
                <${Type}
                  value=${datavalue.value.time
                    ? datavalue.value.time.match(/^[-\+](\d{4}-\d{2}-\d{2})/)[1]
                    : ''}
                  type="date"
                  proxyName="${name}.datavalue.value.time"
                  onValueChange=${newValue => {
                    newValue.value = `+${newValue.value}T00:00:00Z`;
                    onValueChange(newValue);
                  }} />
              `;
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
                textValue=${datavalue?.value?.text}
                textName="${name}.datavalue.value.text"
                languageValue=${datavalue?.value?.language}
                languageName="${name}.datavalue.value.language"
                required=${true}
                onValueChange=${onValueChange}
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
