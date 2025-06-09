import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Id extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/id.css'));
  }
  render({ id }) {
    const [fullId, wikibase, localId, parentId, subId] = id.match(/^(?<wikibase>[^\:]+):(?<localId>(?<parentId>\w\d+)(?:-(?<subId>\w\d+)))$/)

    return html`<span class="id ${subId && 'id--has-subid'}">${ subId ? html`<span class="id__context">${parentId}-</span>${subId}` : localId}</span>`;
  }
}

export default Id;
