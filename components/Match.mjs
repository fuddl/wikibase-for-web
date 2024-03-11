import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import { metaToEdits } from '../mapping/meta.mjs';

import Choose from './Choose.mjs';
import Change from './Change.mjs';

const html = htm.bind(h);

const Match = ({ suggestions, manager }) => {
  const [open, setOpen] = useState(0);
  const [metaData, setMetaData] = useState(
    new Array(suggestions.length).fill(null),
  );

  const [additionalEdits, setAdditionalEdits] = useState(
    new Array(suggestions.length).fill([]),
  );

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/match.css'));
    (async () => {
      await requestMetadata(open);
    })();
  }, []);

  const requestMetadata = async index => {
    if (additionalEdits[index].length > 0) {
      return;
    }
    const requestedMetadata = await browser.runtime.sendMessage({
      type: 'request_metadata',
      url: suggestions[index].matchFromUrl,
    });
    const newMetaData = [...metaData];
    newMetaData[index] = requestedMetadata.response;
    setMetaData(newMetaData);
    await updateAdditionalEdits(index, requestedMetadata.response);
  };

  const updateAdditionalEdits = async (index, metadata) => {
    let edits = [...additionalEdits[index]];
    if (metadata?.title) {
      if (suggestions[index]?.titleExtractPattern) {
        const matches = metadata.title.match(
          suggestions[index].titleExtractPattern,
        );
        if (matches?.[1]) {
          edits.push({
            action: 'wbsetaliases',
            add: matches[1],
          });
        }
      }
      if (metadata?.meta) {
        const metaEdits = await metaToEdits({
          meta: metadata.meta,
          wikibase: manager.wikibases[suggestions[index].instance],
          lang: metadata?.lang,
          edits,
        });
        edits = metaEdits;
      }
    }
    const newAdditionalEdits = [...additionalEdits];
    newAdditionalEdits[index] = edits;
    setAdditionalEdits(newAdditionalEdits);
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
        const edits = [...suggestion.proposeEdits, ...additionalEdits[key]];

        manager.wikibase = manager.wikibases[suggestion.instance];

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
              <div class="match__item" data-key=${key}>
                <div class="match__statements">
                  ${Object.entries(edits).map(
                    ([editId, edit]) =>
                      html` <${Change}
                        key=${editId}
                        edit=${edit}
                        manager=${manager} />`,
                  )}
                </div>
                <${Choose}
                  label=${metaData[key]?.title}
                  manager=${manager}
                  wikibase=${suggestion.instance}
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
