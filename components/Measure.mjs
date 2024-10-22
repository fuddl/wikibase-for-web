import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import { urlReference } from '../mapping/urlReference.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Decern from './Decern.mjs';
import Type from './Type.mjs';
import Choose from './Choose.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

async function fetchAllowedUnitd(manager, property) {
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
        .map(items => {
          const id = items?.datavalue?.value?.id;
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

    const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
      shouldFocus,
      message => {
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
        const allowedUnits = await fetchAllowedUnitd(manager, property);
        if (allowedUnits) {
          setAllowedUnits(allowedUnits);
        }
      }
    }, []);

    return html`<div
      class="measure ${isFocused ? 'measure--focus' : ''}"
      ref=${elementRef}>
      <${Type}
        value=${datavalue.value.amount}
        type="number"
        name="${name}.value.amount"
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        step="any"
        onValueChange=${onValueChange} />
      <${Type}
        value=${datavalue.value.unit === '1'
          ? datavalue.value.unit
          : manager.urlFromIdNonSecure(datavalue.value.unit)}
        name="${name}.value.unit"
        type="hidden"
        onValueChange=${onValueChange} />
      <${Choose}
        manager=${manager}
        value=${datavalue.value.unit === '1' ? '' : datavalue.value.unit}
        label=${unitSearch}
        wikibase=${wikibase}
        subject=${subject}
        type="item"
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
