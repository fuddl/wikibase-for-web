import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Engage extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/engage.css'));
  }

  render({ disabled, text, onClick }) {
    return html`<button
      class="engage"
      disabled=${disabled}
      onClick=${onClick}
      type="submit">
      ${text}
    </button>`;
  }
}

export default Engage;
