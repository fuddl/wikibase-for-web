import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
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
                  <li key=${item?.id}>
                    <a
                      class="actions__action"
                      onClick=${async e => {
                        e.preventDefault();
                        try {
                          await browser.runtime.sendMessage({
                            type: 'request_navigate',
                            entity: item.id,
                          });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
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
