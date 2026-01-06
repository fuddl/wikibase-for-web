import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Amount from './Amount.mjs';
import Annote from './Annote.mjs';
import Appoint from './Appoint.mjs';
import Choose from './Choose.mjs';
import Knit from './Knit.mjs';
import Map from './Map.mjs';
import Measure from './Measure.mjs';
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
    property,
    options,
    requireFocus,
  }) {
    return html`
      <fieldset class="nibble">
        <input name="${name}.datatype" value=${datatype} type="hidden" />
        <input name="${name}.snaktype" value="value" type="hidden" />
        ${[
          'external-id',
          'commonsMedia',
          'globe-coordinate',
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
            case 'wikibase-form':
            case 'wikibase-item':
            case 'wikibase-lexeme':
            case 'wikibase-property':
            case 'wikibase-sense':
              return html`<${Choose}
                manager=${manager}
                value=${datavalue?.value?.id.replace(/^\w+\:/, '')}
                wikibase=${manager.wikibase.id}
                name="${name}.datavalue.value.id"
                subject=${subject}
                suggestedEntities=${options}
                requireFocusForSuggestions=${requireFocus}
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
                property=${property}
                wikibase=${manager.wikibase.id}
                onValueChange=${onValueChange} />`;
            case 'external-id':
            case 'string':
            case 'url':
              return html`<${Knit}
                value=${datavalue.value}
                name="${name}.datavalue.value"
                wikibase=${manager.wikibase.id}
                subject=${subject}
                required=${true}
                property=${property}
                isUrl=${datatype === 'url'}
                onValueChange=${onValueChange}
                onAddJobs=${value => {
                  if (onAddJobs) {
                    onAddJobs(value);
                  }
                }}
                onUpdateReference=${onUpdateReference}
                manager=${manager} />`;
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
                property=${property}
                onValueChange=${onValueChange}
                onAddJobs=${value => {
                  if (onAddJobs) {
                    onAddJobs(value);
                  }
                }}
                onUpdateReference=${onUpdateReference}
                manager=${manager} />`;
            case 'quantity':
              return html`<${Measure}
                datavalue=${datavalue}
                manager=${manager}
                wikibase=${manager.wikibase.id}
                subject=${subject}
                onUpdateReference=${onUpdateReference}
                name="${name}.datavalue"
                property=${property}
                onValueChange=${onValueChange} />`;
            case 'globe-coordinate':
              return html`<div class="nibble__line">
                  <${Type}
                    value=${datavalue.value.latitude}
                    type="number"
                    dataType="float"
                    name="${name}.datavalue.value.latitude"
                    step="any"
                    min="-90"
                    max="90"
                    onValueChange=${onValueChange} />
                  /
                  <${Type}
                    value=${datavalue.value.longitude}
                    type="number"
                     dataType="float"
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
                    min="0.00000000001"
                    max="10"
                    step="0.00000000001"
                    name="${name}.datavalue.value.precision"
                    onValueChange=${onValueChange} />
                </div>
                <${Type}
                  value=${manager.urlFromIdNonSecure(datavalue.value.globe)}
                  type="text"
                  disabled
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
