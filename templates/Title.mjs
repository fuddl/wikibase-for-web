import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Title extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/title.css'));
  }
  render({ text, language }) {
    return html`<i class="title" lang="${language}">${text}</i>`;
  }
}

export default Title;
