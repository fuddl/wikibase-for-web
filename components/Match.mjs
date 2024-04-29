import { h, render, Component } from '../importmap/preact.mjs';
import { useState, useEffect } from '../importmap/preact-hooks.mjs';
import htm from '../importmap/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { formDataToData } from '../modules/formDataToData.mjs';
import DismissedEditsAPI from '../modules/DismissedEditsAPI.mjs';
import OptionsHistoryAPI from '../modules/OptionsHistoryAPI.mjs';
import { getPropertySubjectByConstraint } from '../modules/getPropertySubjectByConstraint.mjs';

import { suggestedEdits } from '../mapping/index.mjs';

import Choose from './Choose.mjs';
import Change from './Change.mjs';
import Engage from './Engage.mjs';

const html = htm.bind(h);

const submit = e => {
  e.preventDefault();

  for (const component of e.target.form) {
    if (component.nodeName === 'SELECT' && component.disabled == false) {
      const optionsHistoryAPI = new OptionsHistoryAPI();
      optionsHistoryAPI.updateOptionPick(
        Array.from(component.children).map(option => option.value),
        component.value,
      );
    }
  }

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

  const dismissed = new DismissedEditsAPI();

  for (const edit of data.edits) {
    if (edit.signature) {
      dismissed.toggleDismissedEdit(edit.signature, !edit.apply);
    }
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

      if (edit?.claim?.qualifiers) {
        edit.claim.qualifiers.forEach(qualifier => {
          jobs.push({
            action: 'qualifier:set',
            instance: data.instance,
            statement: 'LAST',
            value: qualifier.snak.datavalue,
            property: qualifier.property,
            snaktype: qualifier.snak.snaktype,
          });
        });
      }

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

  if (data.matchUrl) {
    jobs.push({
      action: 'resolver:add',
      entity: data.subjectId === 'CREATE' ? 'LAST' : data.subjectId,
      instance: data.instance,
      url: data.matchUrl,
    });
  }

  // console.debug(jobs);

  try {
    browser.runtime.sendMessage({
      type: 'add_to_edit_queue',
      edits: jobs,
    });
    if (data.subjectId !== 'CREATE') {
      browser.runtime.sendMessage({
        type: 'resolved',
        candidates: [
          {
            instance: data.instance,
            specificity: 1000,
            matchFromUrl: data.matchUrl,
            resolved: [
              {
                specificity: 1000,
                id: `${data.instance}:${data.subjectId}`,
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const MatchInstance = ({ suggestion, manager, edits }) => {
  const [subjectSelected, setSubjectSelected] = useState(false);
  const [searchText, setSeachText] = useState('');
  const [allEdits, setAllEdits] = useState(edits);
  const [metaData, setMetaData] = useState({});
  const [lang, setLang] = useState(navigator.language);
  const [subjectType, setSubjectType] = useState('item');

  useEffect(() => {
    setAllEdits(edits);
  }, []);

  const updateAdditionalEdits = async metadata => {
    let newSearchTitle = '';
    let newEdits = [...edits];
    if (metadata?.title) {
      newSearchTitle = metadata.title;
      if (suggestion?.titleExtractPattern) {
        const matches = metadata.title.match(suggestion.titleExtractPattern);
        if (matches?.[1]) {
          newSearchTitle = matches[1];
          newEdits.push({
            action: 'labals:add',
            labels: matches[1],
          });
        }
      }
      const additionalEdits = await suggestedEdits(
        metadata,
        manager.wikibases[suggestion.instance],
      );
      newEdits = [...newEdits, ...additionalEdits];
    }

    setAllEdits(newEdits);
    setSeachText(newSearchTitle);
  };

  const requestMetadata = async () => {
    const requestedMetadata = await browser.runtime.sendMessage({
      type: 'request_metadata',
      url: suggestion.matchFromUrl,
    });

    const newMetaData = requestedMetadata.response;
    setMetaData(newMetaData);

    if (requestedMetadata?.response?.lang) {
      setLang(requestedMetadata.response.lang);
    }

    await updateAdditionalEdits(newMetaData);
  };

  useEffect(() => {
    (async () => {
      await requestMetadata();
    })();
  }, []);

  useEffect(async () => {
    const requestedType = await getPropertySubjectByConstraint(
      suggestion,
      manager,
    );

    setSubjectType(requestedType);
  }, []);

  return html`
    <form class="match__form">
      <input type="hidden" value=${suggestion.instance} name="instance" />
      <div class="match__item">
        <div class="match__statements">
          ${Object.entries(allEdits).map(
            ([editId, edit]) =>
              html`<${Change}
                key=${editId}
                claim=${edit?.claim}
                labels=${edit?.labels}
                action=${edit.action}
                signature=${edit?.signature}
                name=${`edits.${editId}`}
                manager=${manager} />`,
          )}
        </div>
        <${Choose}
          label=${searchText}
          manager=${manager}
          wikibase=${suggestion.instance}
          name="subjectId"
          type=${subjectType}
          required="true"
          onSelected=${() => {
            setSubjectSelected(true);
          }} />
      </div>
      <input type="hidden" name="matchUrl" value=${suggestion.matchFromUrl} />
      <div class="match__bottom">
        <input
          type="hidden"
          name="lang"
          value=${navigator.language.toLowerCase()} />
        <input name="instance" type="hidden" value=${suggestion.instance} />
        <${Engage}
          text=${browser.i18n.getMessage('send_to_instance', [
            manager.wikibases[suggestion.instance].name,
          ])}
          onClick=${submit}
          disabled=${!subjectSelected} />
      </div>
    </form>
  `;
};

const Match = ({ suggestions, manager }) => {
  const [open, setOpen] = useState(0);
  const [forceRefresh, setForceRefresh] = useState('');

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/match.css'));
  }, []);

  useEffect(() => {
    (async () => {
      manager.updateSidebarAction(suggestions[open].instance);
    })();
  }, [open]);

  useEffect(() => {
    setForceRefresh(JSON.stringify(suggestions));
  }, [suggestions]);

  return html`
    <div class="match">
      <h1>${browser.i18n.getMessage('match_title')}</h1>
      ${suggestions.map((suggestion, index) => {
        let edits = suggestion.proposeEdits;
        manager.wikibase = manager.wikibases[suggestion.instance];
        return html`
          <details ...${{ open: index === open }} class="match__instance">
            <summary
              class="match__instance-name"
              onClick=${e => {
                e.preventDefault();
                setOpen(index);
              }}>
              ${manager.wikibases[suggestion.instance].name}
            </summary>
            ${index === open &&
            html`<${MatchInstance}
              suggestion=${suggestion}
              manager=${manager}
              key=${`${forceRefresh}-${index}`}
              edits=${edits} />`}
          </details>
        `;
      })}
    </div>
  `;
};

export default Match;
