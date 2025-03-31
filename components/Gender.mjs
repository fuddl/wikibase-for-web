import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

function Gender({ items, manager }) {
  if (!items.length) return null;
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/gender.css'));
  }, []);

  const [genderPrefix, genderInterfix, genderSuffix] = browser.i18n
    .getMessage('gloss_gender_format', ['￼', '￼'])
    .split('￼');

  return html`
    <span class="gender">
      ${genderPrefix}${items.reduce(
        (acc, item, index) =>
          index === 0
            ? [html`<${Thin} id=${item} manager=${manager} />`]
            : [...acc, genderInterfix, html`<${Thin} id=${item} manager=${manager} />`],
        [],
      )}${genderSuffix}
    </span>
  `;
}

export default Gender; 