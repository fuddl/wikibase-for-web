import { h } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { useState, useEffect } from '../importmap/preact-hooks.mjs';
import Engage from './Engage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

function Inform({ id, children }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedIds')) || [];
    if (dismissedIds.includes(id)) {
      setIsVisible(false);
    }
  }, [id]);

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/inform.css'));
  });

  function dismissContent() {
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedIds')) || [];
    dismissedIds.push(id);
    localStorage.setItem('dismissedIds', JSON.stringify(dismissedIds));
    setIsVisible(false);
  }

  return isVisible
    ? html`
        <aside class="inform">
          <div class="inform__inner">
            ${children}
            <${Engage}
              onClick=${dismissContent}
              text=${browser.i18n.getMessage('dismiss_action')} />
          </div>
        </aside>
      `
    : null;
}

export default Inform;
