import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect, useRef } from '../importmap/preact-hooks.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import AutoDesc from './AutoDesc.mjs';

const html = htm.bind(h);

const Choose = ({
  value,
  label,
  name,
  type,
  required = false,
  manager,
  wikibase,
  onSelected,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [shouldFetch, setShouldFetch] = useState(true);
  const [choosenId, setChoosenId] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/choose.css'));
  }, []);

  useEffect(() => {
    setInputValue(label);
  }, [label]);

  useEffect(() => {
    if (choosenId !== '') {
      onSelected();
    }
  }, [choosenId]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const searchUrl = manager.wikibases[wikibase].api.searchEntities({
        search: inputValue,
        type: type ?? 'item',
      });
      const autocomplete = await fetch(searchUrl).then(res => res.json());
      if (autocomplete?.success) {
        if (type === 'item') {
          autocomplete.search.push({
            label: autocomplete.searchinfo.search,
            description: browser.i18n.getMessage('create_new_entity'),
            id: 'CREATE',
          });
        }
        setSuggestions(autocomplete.search);
      }
    };

    if (inputValue && shouldFetch) {
      const debounce = setTimeout(() => {
        fetchSuggestions();
      }, 100);
      return () => clearTimeout(debounce);
    }
  }, [inputValue, type]);

  const handleKeyDown = e => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prevIndex =>
        Math.min(prevIndex + 1, suggestions.length - 1),
      );
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prevIndex => Math.max(prevIndex - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      setInputValue(suggestions[selectedIndex]?.label || '');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const autoDescApi = manager.wikibases[wikibase]?.autodesc;

  return html`
    <div class="choose">
      <div class="choose__type-wrap">
        <input
          class="choose__value"
          type="text"
          value=${choosenId}
          required=${required}
          name=${name}
          ref=${inputRef} />
        <input
          class="choose__type"
          value=${inputValue}
          name="search"
          type="search"
          autocomplete="off"
          placeholder=${browser.i18n.getMessage(`search_${type}_placeholder`)}
          onInput=${e => {
            setInputValue(e.target.value);
            setShouldFetch(true);
          }}
          onKeyDown=${handleKeyDown} />
        <span class="choose__id"
          >${choosenId === 'CREATE'
            ? browser.i18n.getMessage('new_entity')
            : choosenId}</span
        >
      </div>
      <div class="choose__picker">
        ${suggestions.map(
          (suggestion, index) => html`
            <a
              class=${`choose__picker__pick ${index === selectedIndex ? 'choose__picker__pick--active' : ''}`}
              onMouseDown=${() => {
                setShouldFetch(false);
                setInputValue(suggestion.label);
                setSuggestions([]);
                setChoosenId(suggestion.id);
                setSelectedIndex(-1);
              }}
              onMouseMove=${() => {
                setSelectedIndex(index);
              }}>
              <div class="choose__picker__pick-title">
                ${suggestion.label ?? suggestion.id}
              </div>
              <div class="choose__picker__pick-description">
                ${suggestion?.description
                  ? suggestion.description
                  : autoDescApi
                    ? html`<${AutoDesc}
                        id=${suggestion.id}
                        api=${autoDescApi} />`
                    : null}
              </div>
            </a>
          `,
        )}
      </div>
    </div>
  `;
};

export default Choose;
