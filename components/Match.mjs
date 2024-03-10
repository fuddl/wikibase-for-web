import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Snack from './Snack.mjs';
import Choose from './Choose.mjs';
import Change from './Change.mjs';

const html = htm.bind(h);

const Match = ({ suggestions, manager }) => {
  const [open, setOpen] = useState(0);
  const [metaData, setMetaData] = useState(
    new Array(suggestions.length).fill(null),
  );
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/match.css'));
    (async () => {
      requestMetadata(open);
    })();
  }, []);

  const requestMetadata = async index => {
    const requestedMetadata = await browser.runtime.sendMessage({
      type: 'request_metadata',
      url: suggestions[index].matchFromUrl,
    });
    const newMetaData = [...metaData];
    newMetaData[index] = requestedMetadata.response;
    setMetaData(newMetaData);
  };

  useEffect(() => {
    (async () => {
      await requestMetadata(open);
    })();
  }, [open]);

  return html`
    <div class="match">
      <h1>Match</h1>
      ${suggestions.map((suggestion, key) => {
        let label = '';
        if (metaData?.[key]?.title) {
          if (suggestion?.titleExtractPattern) {
            const matches = metaData[key].title.match(
              suggestion.titleExtractPattern,
            );
            if (matches?.[1]) {
              label = matches[1];
            }
          } else {
            label = metaData[key].title;
          }
        }

        return html`
          <details ...${{ open: key == open }} class="match__instance">
            <summary
              class="match__instance-name"
              onClick=${e => {
                e.preventDefault();
                setOpen(key);
              }}>
              ${manager.wikibases[suggestion.instance].name}
            </summary>
            <form class="match__form">
              <input
                type="hidden"
                value=${suggestions.instance}
                name="instance" />
              <div
                class="match__item"
                data-key=${key}
                data-instance=${suggestions.instance}>
                <div class="match__statements">
                  ${Object.entries(suggestion.proposeEdits).map(
                    ([editId, edit]) =>
                      html`<${Change}
                        key=${editId}
                        edit=${edit}
                        manager=${manager} />`,
                  )}
                </div>
                <${Choose}
                  label=${label}
                  manager=${manager}
                  name="subjectId"
                  required="true" />
              </div>
              <div class="match__bottom">
                <button class="match__send" disabled type="submit">
                  ${browser.i18n.getMessage('send_to_instance', [
                    manager.wikibases[suggestion.instance].name,
                  ])}
                </button>
              </div>
            </form>
          </details>
        `;
      })}
    </div>
  `;
};

export default Match;
