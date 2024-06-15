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
        <${Inform} id="edit-descriptions">
          <p>You can now <strong>update descriptions!</strong></p>
          <p>Just click the <${Edit} compact=${true} /> next to an item's id.</p>
          <p>Automatic descriptions are provided by <a href="https://autodesc.toolforge.org/">auto​desc.​tool​forge.org</a>.</p>
        </${Inform}>
        ${
          suggestions?.length > 0
            ? html`<${Match} suggestions=${suggestions} manager=${manager} />`
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
                subjectId=${workbench.subjectId}
                manager=${manager} />`
            : null
        }
      </div>
    `;
  }
}

export default Main;
