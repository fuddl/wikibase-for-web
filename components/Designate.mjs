import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Decern from './Decern.mjs';
import Type from './Type.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

class Designate extends Component {
  render({
    textValue: initialTextValue,
    textName,
    languageValue: initialLanguageValue,
    languageName,
    onValueChange,
    manager,
    required,
    shouldFocus,
  }) {
    const [textValue, setTextValue] = useState(initialTextValue ?? '');
    const [languageValue, setLanguageValue] = useState(
      initialLanguageValue ?? '',
    );

    useEffect(() => {
      if (onValueChange) {
        onValueChange({
          name: textName,
          value: textValue,
        });
        onValueChange({
          name: languageName,
          value: languageValue,
        });
      }
    }, [textValue, languageValue]);

    useEffect(() => {
      requireStylesheet(browser.runtime.getURL('/components/designate.css'));
    }, []);

    const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
      shouldFocus,
      message => {
        if (message.type === 'text_selected') {
          setTextValue(message.value);
          if (message.lang) {
            setLanguageValue(message.lang);
          }
        }
      },
    );

    return html`<div
      class="designate ${isFocused ? 'designate--focus' : ''}"
      ref=${elementRef}>
      <div class="designate__rendered">${textValue ?? ''}</div>
      <textarea
        value=${textValue ?? ''}
        class="designate__text"
        required=${required}
        name="${textName}"
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        lang=${languageValue}
        rows="1"
        onInput=${e => {
          setTextValue(e.currentTarget.value);
        }}></textarea>
      <div class="designate__lang">
        <${Decern}
          value=${languageValue ?? ''}
          context="monolingualtext"
          name="${languageName}"
          onFocus=${handleFocus}
          onBlur=${handleBlur}
          onValueChange=${newValue => {
            setLanguageValue(newValue.value);
          }}
          manager=${manager} />
      </div>
    </div>`;
  }
}

export default Designate;
