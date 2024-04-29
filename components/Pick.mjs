import { h, render, Component } from '../importmap/preact.mjs';
import { useEffect } from '../importmap/preact-hooks.mjs';
import htm from '../importmap/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Describe from './Describe.mjs';

const html = htm.bind(h);

const Pick = ({ options, manager }) => {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/pick.css'));
  }, []);

  return html`<nav class="pick">
    <h1 class="pick__title">
      ${browser.i18n.getMessage('ambiguous_url_title')}
    </h1>
    <p>${browser.i18n.getMessage('ambiguous_url_intro')}</p>
    ${options.map(
      option => html`
        <a href=${manager.urlFromId(option.id)} class="pick__option">
          <div class="pick__option-label">
            <strong>
              <${Describe} id=${option.id} source="labels" manager=${manager} />
            </strong>
            ${' '}
            <small class="pick__option-id">(${option.id})</small>
          </div>
          <div class="pick__option-description">
            <${Describe} id=${option.id} manager=${manager} />
          </div>
        </a>
      `,
    )}
  </nav>`;
};

export default Pick;
