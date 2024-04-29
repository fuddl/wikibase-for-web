import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Title extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/title.css'));
  }
  render({ text, language }) {
    return html`<i class="title" lang="${language}">${text}</i>`;
  }
}

export default Title;
