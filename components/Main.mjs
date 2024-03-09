import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Entity from './Entity.mjs';
import Actions from './Actions.mjs';
import Match from './Match.mjs';

const html = htm.bind(h);

class Main extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/main.css'));
  }

  render({ entity, suggestions, otherEntities, manager }) {
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
        ${suggestions.length > 0
          ? html`<${Match} suggestions=${suggestions} manager=${manager} />`
          : null}
        <main class="main__content">
          <${Entity} ...${entity} manager=${manager} />
        </main>
        ${actionGroups.length > 0
          ? html`<${Actions} groups=${actionGroups} manager=${manager} />`
          : null}
      </div>
    `;
  }
}

export default Main;
