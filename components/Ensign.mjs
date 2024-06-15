import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import AutoDesc from './AutoDesc.mjs';
import Thing from './Thing.mjs';
import Edit from './Edit.mjs';
import { descriptionsEdits } from '../mapping/description.mjs';

const html = htm.bind(h);

class Ensign extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mayEdit: null,
    };
  }

  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/ensign.css'));
  }

  async checkEditPermissions() {
    if (
      await this.props.manager.hasEditPermissions(
        this.props.manager.wikibase.id,
      )
    ) {
      this.setState({ mayEdit: true });
    }
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
    const selectId = e => {
      e.preventDefault();
      const range = document.createRange();
      const selection = window.getSelection();
      selection.removeAllRanges();
      range.selectNodeContents(e.target);
      selection.addRange(range);
    };

    const { descLang, desc } = (() => {
      if (lexicalCategory && language) {
        return {
          desc: html`<${Thing} id=${language} manager=${manager} />, ${' '}
            <${Thing} id=${lexicalCategory} manager=${manager} />`,
        };
      }
      if (description?.value) {
        return {
          desc: description.value,
          descLang: description.language,
        };
      } else {
        return {
          desc: html`<${AutoDesc} id=${localId} api=${autoDescApi} />`,
        };
      }
    })();

    const editDescriptions = async () => {
      const edits = await descriptionsEdits(id, descriptions, manager);
      await browser.runtime.sendMessage({
        type: 'request_workbench',
        workbench: {
          title: browser.i18n.getMessage('edit_descriptions'),
          edits: edits,
          subjectId: id,
        },
      });
    };

    return html`
      <div
        class="ensign ${this.state.mayEdit ? 'ensign--editable' : null}"
        onMouseEnter=${e => {
          this.checkEditPermissions();
        }}>
        <h1 class="ensign__title" lang=${label?.language}>
          ${label?.value ||
          (lemmas
            ? Object.entries(lemmas).map(([lang, lemma]) => lemma?.value)
            : ''
          ).join('/')}
        </h1>
        ${' '}
        <small class="ensign__id">
          <a onClick=${selectId} class="ensign__id__link" href=${canonical}
            >${localId}</a
          >
        </small>
        <p class="ensign__description" lang=${descLang}>${desc}</p>
        ${this.state.mayEdit
          ? html`<span class="ensign__edit">
              <${Edit} action=${editDescriptions} />
            </span>`
          : null}
      </div>
    `;
  }
}

export default Ensign;
