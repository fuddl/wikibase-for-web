import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import { urlReference } from '../mapping/urlReference.mjs';
import fetchExampleData from '../modules/fetchExampleData.mjs';

import { MonolingualTextClaim } from '../types/Claim.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Decern from './Decern.mjs';
import Type from './Type.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

class Designate extends Component {
  render({
    manager,
    name,
    onAddJobs,
    onUpdateReference,
    property,
    onValueChange,
    required,
    shouldFocus,
    subject,
    value,
    wikibase,
  }) {
    const [prevIsFocused, setPrevIsFocused] = useState(false);
    const [exampleValue, setExampleValue] = useState({});
    const textRef = useRef(null);

    const changeValues = (value, lang) => {
      onValueChange({
        name: `${name}.value`,
        value: {
          text: value,
          language: lang,
        },
      });
    };

    useEffect(async () => {
      requireStylesheet(browser.runtime.getURL('/components/designate.css'));

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

          const multipleValuesMode =
            message?.selectEvent === 'click' && typeof onAddJobs === 'function';
          const currentText = textRef.current.value;
          if (
            currentText === '' ||
            (message.value !== currentText && !multipleValuesMode)
          ) {
            changeValues(
              message.value,
              message?.lang
                ? message.lang.toLowerCase().replace('_', '-')
                : null,
            );
            if (references && onUpdateReference) {
              onUpdateReference(references);
            }
          } else if (message.value === currentText) {
            changeValues('', '');
          } else if (multipleValuesMode) {
            onAddJobs({
              signature: `user_selected:${message.value}:${message.lang}:${JSON.stringify(message.source)}`,
              claim: new MonolingualTextClaim({
                text: message.value,
                language: message.lang,
                references: references,
              }),
            });
          }
        }
      },
    );

    useEffect(() => {
      if (subject) {
        if (isFocused) {
          browser.runtime.sendMessage({
            type: 'highlight_elements',
            modes: ['monolingualtext'],
            blacklist: [subject],
          });
        } else if (prevIsFocused) {
          browser.runtime.sendMessage({
            type: 'unhighlight_elements',
          });
        }
        setPrevIsFocused(isFocused);
      }
    }, [isFocused, subject]);

    const exampleText = exampleValue?.value?.text
      ? browser.i18n.getMessage(
          'placeholder_example_text',
          exampleValue.value.text,
        )
      : null;

    return html`<div
      class="designate ${isFocused ? 'designate--focus' : ''}"
      ref=${elementRef}>
      <div class="designate__rendered">${value?.text || exampleText}</div>
      <textarea
        value=${value.text ?? ''}
        class="designate__text"
        required=${required}
        name="${name}.value.text"
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        lang=${value.language}
        placeholder=${exampleText}
        rows="1"
        ref=${textRef}
        onInput=${e => {
          onValueChange({
            name: e.currentTarget.name,
            value: e.currentTarget.value,
          });
        }}></textarea>
      <div class="designate__lang">
        <${Decern}
          value=${value.language ?? ''}
          context="monolingualtext"
          name="${name}.value.language"
          onFocus=${handleFocus}
          onBlur=${handleBlur}
          onValueChange=${newValue => {
            onValueChange(newValue);
          }}
          manager=${manager} />
      </div>
    </div>`;
  }
}

export default Designate;
