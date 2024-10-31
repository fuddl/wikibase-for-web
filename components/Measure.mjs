import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from '../importmap/preact/hooks/src/index.js';
import { urlReference } from '../mapping/urlReference.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import quantityExtractor from '../modules/quantityExtractor.mjs';
import fetchExampleData from '../modules/fetchExampleData.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

import Decern from './Decern.mjs';
import Type from './Type.mjs';
import Choose from './Choose.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

async function fetchAllowedUnits(manager, property) {
  const [wikibaseId] = property.split(':');
  if (
    manager.wikibases[wikibaseId]?.props?.propertyConstraint &&
    manager.wikibases[wikibaseId]?.props?.itemOfPropertyConstraint &&
    manager.wikibases[wikibaseId]?.items?.allowedUnitsConstraint
  ) {
    const propertyConstraintId =
      manager.wikibases[wikibaseId]?.props?.propertyConstraint;
    const allowedUnitsConstraintId =
      manager.wikibases[wikibaseId]?.items?.allowedUnitsConstraint;
    const itemOfPropertyConstraintId =
      manager.wikibases[wikibaseId]?.props?.itemOfPropertyConstraint;

    const propertyEntity = await manager.add(property);

    if (propertyConstraintId in propertyEntity.claims) {
      const allowedUnits = propertyEntity.claims[propertyConstraintId]
        .filter(
          item =>
            item?.mainsnak?.datavalue?.value?.id ===
            `${wikibaseId}:${allowedUnitsConstraintId}`,
        )
        .map(item => {
          if (itemOfPropertyConstraintId in item.qualifiers) {
            return item.qualifiers[itemOfPropertyConstraintId];
          }
        })
        .flat()
        .filter(item => item.snaktype === 'value')
        .map(item => {
          const id = item?.datavalue?.value?.id;
          if (id) {
            return id;
          }
        });
      return allowedUnits;
    }
  }
}

class Measure extends Component {
  render({
    datavalue,
    name,
    manager,
    property,
    shouldFocus,
    subject,
    wikibase,
    onUpdateReference,
    onValueChange,
  }) {
    const [prevIsFocused, setPrevIsFocused] = useState(false);
    const [unitSearch, setUnitSearch] = useState('');
    const [allowedUnits, setAllowedUnits] = useState([]);
    const [exampleValue, setExampleValue] = useState({});

    const uuid = useMemo(() => crypto.randomUUID(), []);

    const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
      shouldFocus,
      message => {
        if (message.type === 'text_selected') {
          const Extractor = new quantityExtractor();
          const suggestedQuantity = Extractor.extract(message.value);

          if (suggestedQuantity.amount) {
            onValueChange({
              name: `${name}.value.amount`,
              value: suggestedQuantity.amount,
            });
            if (suggestedQuantity.unitString) {
              setUnitSearch(suggestedQuantity.unitString);
            }
          }

          if (onUpdateReference) {
            if (message?.source) {
              onUpdateReference(
                urlReference(message.source, manager.wikibases[wikibase]),
              );
            } else {
              onUpdateReference([]);
            }
          }
        }
        if (message.type === 'quantity_selected') {
          if (message.amount) {
            onValueChange({
              name: `${name}.value.amount`,
              value: message.amount,
            });
          }
          if (message.unitString) {
            setUnitSearch(message.unitString);
          }

          const references = message.source
            ? urlReference(message.source, manager.wikibases[wikibase])
            : [];

          if (references && onUpdateReference) {
            onUpdateReference(references);
          }
        }
      },
    );

    useEffect(() => {
      if (subject) {
        if (isFocused) {
          browser.runtime.sendMessage({
            type: 'highlight_elements',
            modes: ['quantity'],
          });
        } else if (prevIsFocused) {
          browser.runtime.sendMessage({
            type: 'unhighlight_elements',
          });
        }
        setPrevIsFocused(isFocused);
      }
    }, [isFocused, subject]);

    useEffect(() => {
      requireStylesheet(browser.runtime.getURL('/components/measure.css'));
    }, []);

    useEffect(async () => {
      if (property) {
        const allowedUnits = await fetchAllowedUnits(manager, property);
        if (allowedUnits) {
          setAllowedUnits(allowedUnits);
        }
        const propertyExample = await fetchExampleData(manager, property);

        if (propertyExample) {
          if (propertyExample?.value?.unit !== '1') {
            const designator = await manager.fetchDesignators(
              propertyExample.value.unit,
            );
            propertyExample.value.unitLabel = getByUserLanguage(
              designator.labels,
            );
          }
          setExampleValue(propertyExample);
        }
      }
    }, []);

    const exampleText = exampleValue?.value?.amount
      ? browser.i18n.getMessage(
          'placeholder_example_amount',
          exampleValue.value.amount.replace(/^\+/, ''),
        )
      : null;

    const unitPlaceholder = exampleValue?.value?.unitLabel?.value
      ? browser.i18n.getMessage(
          'placeholder_example_unit',
          exampleValue.value.unitLabel.value,
        )
      : browser.i18n.getMessage(`search_unit_placeholder`);

    return html`<div
      class="measure ${isFocused ? 'measure--focus' : ''}"
      ref=${elementRef}>
      <label class="measure__label" for=${`${uuid}_amount`}>
        ${browser.i18n.getMessage('amount')}
      </label>
      <input
        value=${datavalue.value.amount}
        id=${`${uuid}_amount`}
        type="number"
        name="${name}.value.amount"
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        step="any"
        class="measure__amount"
        onInput=${e => {
          onValueChange({
            name: `${name}.value.amount`,
            value: e.target.value,
          });
        }}
        placeholder=${exampleText}
        onValueChange=${onValueChange} />
      <label class="measure__label" for=${`${uuid}_unit`}>
        ${browser.i18n.getMessage('unit')}
      </label>
      <${Type}
        value=${datavalue.value.unit === '1'
          ? datavalue.value.unit
          : manager.urlFromIdNonSecure(datavalue.value.unit)}
        name="${name}.value.unit"
        type="hidden" />
      <${Choose}
        manager=${manager}
        id=${`${uuid}_unit`}
        value=${datavalue.value.unit === '1'
          ? ''
          : datavalue.value.unit.split(':')[1]}
        label=${unitSearch}
        wikibase=${wikibase}
        subject=${subject}
        type="item"
        placeholder=${unitPlaceholder}
        suggestedEntities=${allowedUnits}
        onValueChange="${newValue => {
          onValueChange({
            name: `${name}.value.unit`,
            value: newValue.value,
          });
        }}" />
    </div>`;
  }
}

export default Measure;
