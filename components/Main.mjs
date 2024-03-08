import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Entity from './Entity.mjs';

const html = htm.bind(h);

class Main extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/main.css'));
  }

  render({ entity, manager }) {
    const meta = null;
    return html`
      <div class="main">
        <main class="main__content">
          <${Entity} ...${entity} manager=${manager} />
        </main>
        ${meta ? html`<${Actions} ...${meta} />` : null}
      </div>
    `;
  }
}

export default Main;
