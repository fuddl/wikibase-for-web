import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import AutoDesc from './AutoDesc.mjs';
import Thing from './Thing.mjs';

const html = htm.bind(h);

class Ensign extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/ensign.css'));
  }

  render({
    labels,
    descriptions,
    lemmas,
    lexicalCategory,
    language,
    id,
    manager,
  }) {
    const label = labels ? getByUserLanguage(labels) : null;
    const description = descriptions ? getByUserLanguage(descriptions) : null;
    const canonical = manager.urlFromId(id);

    const [wikibase, localId] = id.split(':');

    const autoDescApi = manager.wikibases[wikibase]?.autodesc;

    return html`
      <div class="ensign">
        <h1 class="ensign__title" lang=${label?.language}>
          ${label?.value ||
          (lemmas
            ? Object.entries(lemmas).map(([lang, lemma]) => lemma?.value)
            : ''
          ).join('/')}
        </h1>
        ${' '}
        <small class="ensign__id">
          <a class="ensign__id__link" href=${canonical}>${localId}</a>
        </small>
        <p class="ensign__description" lang=${description?.language}>
          ${!lexicalCategory && !language
            ? description?.value
              ? description.value
              : autoDescApi
                ? html`<${AutoDesc} id=${localId} api=${autoDescApi} />`
                : null
            : html`<${Thing}
                  id=${`${wikibase}:${language}`}
                  manager=${manager} />, ${' '}
                <${Thing}
                  id=${`${wikibase}:${lexicalCategory}`}
                  manager=${manager} />`}
        </p>
      </div>
    `;
  }
}

export default Ensign;
