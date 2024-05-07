import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Wait extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/wait.css'));
  }

  render({ status }) {
    return html`<div class="wait">
      <div class="wait__mover">
        <span class="wait__bounce"></span>
      </div>
      <div class="wait__status">${status}</div>
    </div>`;
  }
}

export default Wait;
