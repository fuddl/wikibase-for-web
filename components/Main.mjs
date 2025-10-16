import { h, render, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Entity from './Entity.mjs';
import Actions from './Actions.mjs';
import Match from './Match.mjs';
import Pick from './Pick.mjs';
import Inform from './Inform.mjs';
import Peek from './Peek.mjs';
import Edit from './Edit.mjs';

const html = htm.bind(h);

class Main extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/main.css'));
  }

  render({
    entity,
    selectable,
    suggestions,
    workbench,
    otherEntities,
    manager,
    viewId,
  }) {
    const actionGroups = [];

    if (otherEntities) {
      const otherEntityIds = otherEntities.map(otherEntity => {
        return { id: otherEntity.id };
      });
      if (otherEntityIds.length > 0) {
        actionGroups.push({
          title: browser.i18n.getMessage('other_matches_title'),
          items: otherEntityIds,
        });
      }
    }

    return html`
      <div class="main">
        <${Inform} id="please-feedback">
          <p><strong>Like this extension?</strong></p>
          <p>Please consider <a href="https://addons.mozilla.org/en-US/firefox/addon/wikidata/">leaving a review.</a></p>
          <p><strong>Found a bug?</strong></p>
          <p><a href="https://github.com/fuddl/wikibase-for-web/issues/new">Write a bug report</a> or <a href="https://www.wikidata.org/w/index.php?title=Wikidata_talk%3ATools%2FWikidata_for_Web&action=edit&section=new&wvprov=sticky-header">discuss on wikidata.</a></p>
        </${Inform}>
        ${
          suggestions?.length > 0
            ? html`<${Match}
                suggestions=${suggestions}
                manager=${manager}
                viewId=${viewId} />`
            : null
        }
        ${
          (entity || selectable) &&
          html`<main class="main__content">
            ${entity && html`<${Entity} ...${entity} manager=${manager} />`}
            ${selectable &&
            html`<${Pick} options=${selectable} manager=${manager} />`}
          </main>`
        }
        ${
          actionGroups.length > 0
            ? html`<${Actions} groups=${actionGroups} manager=${manager} />`
            : null
        }
        ${
          workbench
            ? html`<${Peek}
                edits=${workbench.edits}
                title=${workbench.title}
                view=${workbench.view}
                subjectId=${workbench.subjectId}
                manager=${manager} />`
            : null
        }
      </div>
    `;
  }
}

export default Main;
