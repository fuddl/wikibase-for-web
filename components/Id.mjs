import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Id extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/id.css'));
  }
  render({ id, manager }) {
    const [fullId, wikibase, localId, parentId, subId] = id.match(/^(?<wikibase>[^\:]+):(?<localId>(?<parentId>\w\d+)(?:-(?<subId>\w\d+)))$/)

    const selectId = e => {
      e.preventDefault();
      const range = document.createRange();
      const selection = window.getSelection();
      selection.removeAllRanges();
      range.selectNodeContents(e.target);
      selection.addRange(range);
    };

    return html`<a class="id ${subId && 'id--has-subid'}" href=${manager.urlFromId(id)} onClick=${selectId}>${ subId ? html`<span class="id__context">${parentId}-</span>${subId}` : localId}</a>`;
  }
}

export default Id;
