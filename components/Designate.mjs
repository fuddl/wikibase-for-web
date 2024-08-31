import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState } from '../importmap/preact/hooks/src/index.js';

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
  }) {
    const [textValue, setTextValue] = useState(initialTextValue ?? '');
    const [languageValue, setLanguageValue] = useState(
      initialLanguageValue ?? '',
    );
    const shouldFocus = true;
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

    return html`<${Type}
        value=${textValue ?? ''}
        type="text"
        isFocused=${isFocused}
        required=${required}
        name="${textName}"
        ref=${elementRef}
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        onValueChange=${newValue => {
          setTextValue(newValue.value);
          if (onValueChange) {
            onValueChange(newValue);
          }
        }} />
      <${Decern}
        value=${languageValue ?? ''}
        context="monolingualtext"
        name="${languageName}"
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        onValueChange=${newValue => {
          setLanguageValue(newValue.value);
          if (onValueChange) {
            onValueChange(newValue);
          }
        }}
        manager=${manager} />`;
  }
}

export default Designate;
