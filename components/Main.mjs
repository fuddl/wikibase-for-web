import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Entity from './Entity.mjs';
import Actions from './Actions.mjs';
import Match from './Match.mjs';
import Pick from './Pick.mjs';

const html = htm.bind(h);

class Main extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/main.css'));
  }

  render({ entity, selectable, suggestions, otherEntities, manager }) {
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
        ${suggestions?.length > 0
          ? html`<${Match} suggestions=${suggestions} manager=${manager} />`
          : null}
        ${(entity || selectable) &&
        html`<main class="main__content">
          ${entity && html`<${Entity} ...${entity} manager=${manager} />`}
          ${selectable &&
          html`<${Pick} options=${selectable} manager=${manager} />`}
        </main>`}
        ${actionGroups.length > 0
          ? html`<${Actions} groups=${actionGroups} manager=${manager} />`
          : null}
      </div>
    `;
  }
}

export default Main;
