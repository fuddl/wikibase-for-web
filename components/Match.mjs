import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Thing from './Thing.mjs';
import Snack from './Snack.mjs';
import Choose from './Choose.mjs';

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
                    ([editId, edit]) => html`
                      <dl class="match__statement">
                        <dt class="match__key">
                          ${edit.action === 'wbcreateclaim' && edit?.property
                            ? html`
                                <${Thing}
                                  id=${edit.property}
                                  manager=${manager} />
                              `
                            : edit.action === 'wbsetaliases'
                              ? 'setAlias'
                              : ''}
                        </dt>
                        <dd class="match__value">
                          ${edit.action === 'wbcreateclaim' && edit.property
                            ? html`
                                <${Snack}
                                  mainsnak=${{
                                    snaktype: edit.snaktype,
                                    datatype: edit.datatype,
                                    property: edit.property,
                                    datavalue: { value: edit.value },
                                  }}
                                  manager=${manager} />
                              `
                            : edit.action === 'wbsetaliases'
                              ? html`<em>${edit.add}</em>`
                              : ''}
                        </dd>
                        <dd class="match__bool">
                          <input
                            name=${`edit-${editId}`}
                            type="checkbox"
                            value=${JSON.stringify(edit)}
                            checked />
                        </dd>
                      </dl>
                    `,
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
