import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Engage extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/engage.css'));
  }

  render({ disabled, text, onClick }) {
    return html`<button class="engage" disabled=${disabled} type="submit">
      ${text}
    </button>`;
  }
}

export default Engage;
