import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

function Zone({ languageStyles, fieldsOfUsage, manager }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/zone.css'));
  }, []);

  const items = [
    ...(languageStyles || []).map(
      id => html`<span class="zone__style"><${Thin} id=${id} manager=${manager} /></span>`,
    ),
    ...(fieldsOfUsage || []).map(
      id => html`<span class="zone__use"><${Thin} id=${id} manager=${manager} /></span>`,
    ),
  ];
  if (!items.length) return null;

  const placeholder = '￼';
  const [prefix, interfix, suffix] = browser.i18n
    .getMessage('gloss_style_format', [placeholder, placeholder])
    .split(placeholder);

  return html`<span class="zone">${prefix}${items.reduce(
        (acc, item, index) => (index === 0 ? [item] : [...acc, interfix, item]),
        [],
      )}${suffix}</span>`;
}

export default Zone;
