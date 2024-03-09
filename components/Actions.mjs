import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Describe from './Describe.mjs';

const html = htm.bind(h);

class Actions extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/actions.css'));
  }
  render({ groups, manager }) {
    return html`
      <nav class="actions">
        ${groups.map(
          group => html`
            <h2 class="actions__headline">${group.title}</h2>
            <ul class="actions__actions">
              ${group.items.map(
                item => html`
                  <li>
                    <a
                      class="actions__action"
                      href="${item.href ?? manager.urlFromId(item.id)}">
                      <img
                        class="actions__moji"
                        src="${item.icon ?? manager.iconFromId(item.id)}" />

                      <span class="actions__title"
                        >${item.title ??
                        html`<${Describe}
                          id=${item.id}
                          source="labels"
                          manager=${manager} />`}</span
                      >
                      <span class="actions__desc"
                        >${item.description ??
                        html`<${Describe}
                          id=${item.id}
                          manager=${manager} />`}</span
                      >
                    </a>
                  </li>
                `,
              )}
            </ul>
          `,
        )}
      </nav>
    `;
  }
}

export default Actions;
