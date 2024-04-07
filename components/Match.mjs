import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../importmap/preact-hooks.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { formDataToData } from '../modules/formDataToData.mjs';

import { suggestedEdits } from '../mapping/index.mjs';

import Choose from './Choose.mjs';
import Change from './Change.mjs';
import Engage from './Engage.mjs';

const html = htm.bind(h);

const Match = ({ suggestions, manager }) => {
  const submit = e => {
    e.preventDefault();
    const data = formDataToData(e.target.form);

    const jobs = [];

    if (data.subjectId === 'CREATE') {
      jobs.push({
        action: 'entity:create',
        instance: data.instance,
        new: 'item',
        data: {
          labels: [
            {
              language: data.lang,
              value: data.search,
            },
          ],
        },
      });
    }

    for (const edit of data.edits) {
      if (!edit.apply) {
        continue;
      }
      if (edit?.action === 'claim:create') {
        jobs.push({
          action: edit.action,
          instance: data.instance,
          entity: data.subjectId === 'CREATE' ? 'LAST' : data.subjectId,
          claim: edit.claim,
        });

        if (edit?.claim?.references) {
          edit.claim.references.forEach(reference => {
            jobs.push({
              action: 'reference:set',
              instance: data.instance,
              statement: 'LAST',
              snaks: reference.snaks,
            });
          });
        }
      }
    }

    try {
      browser.runtime.sendMessage(browser.runtime.id, {
        type: 'add_to_edit_queue',
        edits: jobs,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const [open, setOpen] = useState(0);
  const [lang, setLang] = useState(navigator.language);
  const [subjectSelected, setSubjectSelected] = useState(false);
  const [metaData, setMetaData] = useState(
    new Array(suggestions.length).fill(null),
  );

  const [searchTexts, setSeachTexts] = useState(
    new Array(suggestions.length).fill(''),
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

    if (requestedMetadata?.response?.lang) {
      setLang(requestedMetadata.response.lang);
    }

    await updateAdditionalEdits(index, newMetaData[index]);
  };

  const updateAdditionalEdits = async (index, metadata) => {
    let newSearchTitle = '';
    let edits = [...additionalEdits[index]];
    if (metadata?.title) {
      newSearchTitle = metadata.title;
      if (suggestions[index]?.titleExtractPattern) {
        const matches = metadata.title.match(
          suggestions[index].titleExtractPattern,
        );
        if (matches?.[1]) {
          newSearchTitle = matches[1];
          edits.push({
            action: 'labals:add',
            labels: matches[1],
          });
        }
      }
      const newSuggestedEdits = await suggestedEdits(
        metadata,
        manager.wikibases[suggestions[index].instance],
      );
      edits = [...edits, ...newSuggestedEdits];
    }
    const newAdditionalEdits = [...additionalEdits];
    newAdditionalEdits[index] = edits;
    setAdditionalEdits(newAdditionalEdits);

    const newSearchtexts = [...searchTexts];
    newSearchtexts[index] = newSearchTitle;
    setSeachTexts(newSearchtexts);
  };

  useEffect(() => {
    (async () => {
      await requestMetadata(open);
      manager.updateSidebarAction(suggestions[open].instance);
    })();
  }, [open]);

  return html`
    <div class="match">
      <h1>${browser.i18n.getMessage('match_title')}</h1>
      ${suggestions.map((suggestion, key) => {
        let edits = suggestion.proposeEdits;
        if (key in additionalEdits) {
          edits = [...edits, ...additionalEdits[key]];
        }

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
                      html`<${Change}
                        key=${editId}
                        claim=${edit?.claim}
                        labels=${edit?.labels}
                        action=${edit.action}
                        name=${`edits.${editId}`}
                        manager=${manager} />`,
                  )}
                </div>
                <${Choose}
                  label=${searchTexts[key]}
                  manager=${manager}
                  wikibase=${suggestion.instance}
                  name="subjectId"
                  required="true"
                  onSelected=${() => {
                    setSubjectSelected(true);
                  }} />
              </div>
              <div class="match__bottom">
                <input type="hidden" name="lang" value=${lang} />
                <input
                  name="instance"
                  type="hidden"
                  value=${suggestion.instance} />
                <${Engage}
                  text=${browser.i18n.getMessage('send_to_instance', [
                    manager.wikibases[suggestion.instance].name,
                  ])}
                  onClick=${submit}
                  disabled=${!subjectSelected} />
              </div>
            </form>
          </details>
        `;
      })}
    </div>
  `;
};

export default Match;
