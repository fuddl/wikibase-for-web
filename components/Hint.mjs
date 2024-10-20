import { h } from '../importmap/preact/src/index.js';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Edit from './Edit.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

function Hint({ text, icon, action, actionTitle }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/hint.css'));
  });

  return html`
    <aside class="hint">
      <div class="hint__text">${text}</div>
      <div class="hint__action">
        <${Edit} title=${actionTitle} icon=${icon} action=${action} />
      </div>
    </aside>
  `;
}

export default Hint;
