import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Ensign extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/ensign.css'));
  }

  render({ labels, descriptions, id, manager }) {
    const label = getByUserLanguage(labels);
    const description = getByUserLanguage(descriptions);
    const canonical = manager.urlFromId(id);

    const [wikibase, localId] = id.split(':');

    return html`
      <div class="ensign">
        <h1 class="ensign__title" lang=${label.language}>${label.value}</h1>
        ${' '}
        <small class="ensign__id">
          <a class="ensign__id__link" href=${canonical}>${localId}</a>
        </small>
        <p class="ensign__description" lang=${description.language}>
          ${description.value}
        </p>
      </div>
    `;
  }
}

export default Ensign;
