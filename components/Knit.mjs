import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import { urlReference } from '../mapping/urlReference.mjs';
import fetchExampleData from '../modules/fetchExampleData.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

class Knit extends Component {
  render({
    isUrl,
    manager,
    name,
    onAddJobs,
    onUpdateReference,
    onValueChange,
    property,
    required,
    shouldFocus,
    subject,
    value,
    wikibase,
  }) {
    const [prevIsFocused, setPrevIsFocused] = useState(false);
    const [exampleValue, setExampleValue] = useState({});
    const textRef = useRef(null);

    const changeValue = value => {
      onValueChange({
        name: name,
        value: value,
      });
    };

    useEffect(async () => {
      requireStylesheet(browser.runtime.getURL('/components/knit.css'));

      if (property) {
        const propertyExample = await fetchExampleData(manager, property);
        if (propertyExample) {
          setExampleValue(propertyExample);
        }
      }
    }, []);

    const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
      shouldFocus,
      message => {
        if (message.type === 'text_selected') {
          const references = message.source
            ? urlReference(message.source, manager.wikibases[wikibase])
            : [];

          const currentText = textRef.current.value;
          if (currentText === '' || message.value !== currentText) {
            changeValue(message.value);
            if (references && onUpdateReference) {
              onUpdateReference(references);
            }
          } else if (message.value === currentText) {
            changeValue('');
          }
        }
      },
    );

    const exampleText = exampleValue?.value
      ? browser.i18n.getMessage('placeholder_example_text', exampleValue.value)
      : null;

    return html`<div
      class="knit ${isFocused ? 'knit--focus' : ''}"
      ref=${elementRef}>
      <input
        value=${value ?? ''}
        class="knit__text"
        required=${required}
        name=${name}
        type=${isUrl ? 'url' : 'text'}
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        placeholder=${exampleText}
        ref=${textRef}
        onInput=${e => {
          onValueChange({
            name: e.currentTarget.name,
            value: e.currentTarget.value,
          });
        }} />
    </div>`;
  }
}

export default Knit;
