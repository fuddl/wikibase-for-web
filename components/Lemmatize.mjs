import { h, Component } from '../importmap/preact/src/index.js';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thing from './Thing.mjs';
import useExtraFocus from '../modules/focusExtra.mjs';

const html = htm.bind(h);

export default function Lemmatize({
  name,
  lang,
  value,
  onValueChange,
  required,
  manager,
}) {
  const [language, setLanguage] = useState(
    (lang.match(/(Q\d+)$/) || [])[1] || false,
  );

  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    const doFetch = async () => {
      const languageItem = await manager.queryManager.query(
        manager.wikibase,
        manager.queryManager.queries.languageByIETF,
        { lang },
      );
      if (languageItem) {
        setLanguage(languageItem);
      }

      const exampleLemmas = await manager.queryManager.query(
        manager.wikibase,
        manager.queryManager.queries.randomLemmaByLang,
        { lang },
      );
      if (exampleLemmas && exampleLemmas.length > 0) {
        setPlaceholder(
          exampleLemmas[Math.floor(Math.random() * exampleLemmas.length)],
        );
      }
    };

    doFetch();
  }, [lang, manager]);

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/lemmatize.css'));
  }, []);

  const { isFocused, handleFocus, handleBlur } = useExtraFocus(
    false,
    message => {
      if (message.type === 'text_selected' && message.value.length > 0) {
        onValueChange({
          name,
          value: message.value,
        });
      }
    },
  );

  return html`
    <div class="lemmatize ${isFocused ? 'lemmatize--focus' : ''}">
      <label class="lemmatize__label">
        ${language
          ? html`<${Thing}
              id=${`${manager.wikibase.id}:${language}`}
              manager=${manager} />`
          : lang}
      </label>
      <input
        class="lemmatize__input"
        required=${required}
        lang=${lang}
        onFocus=${handleFocus}
        onBlur=${handleBlur}
        name=${name}
        placeholder=${placeholder}
        value=${value}
        onInput=${e => {
          onValueChange({
            name: name,
            value: e.target.value,
          });
        }} />
    </div>
  `;
}
