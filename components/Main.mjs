import { h, render, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Entity from './Entity.mjs';
import Actions from './Actions.mjs';
import Match from './Match.mjs';
import Pick from './Pick.mjs';
import Inform from './Inform.mjs';

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
        <${Inform} id="update">
          <p>Hey there! I've just rolled out an update for the extension.</p>
          <p>Some features are still missing. Don't worry, I plan to bring them all back! Please let me know which features you miss most <a href="https://www.wikidata.org/wiki/Wikidata_talk:Tools/Wikidata_for_Web">on the extensions talk page.</a></p>
          <p>Found a bug? I'm sorry about that and would appreciate it if you could report it to me <a href="https://github.com/fuddl/wikibase-for-web/issues/new">on the issue tracker.</a></p>
          <p>Sorry for any inconvenience, and thanks for your support!</p>
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
      </div>
    `;
  }
}

export default Main;
