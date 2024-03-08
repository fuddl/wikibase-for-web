import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Earl extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/earl.css'));
  }

  render({ value: href }) {
    const shortUrl = href
      .replace(/^[a-z]+\:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/index\.(php|html?)$/, '')
      .replace(/\/$/, '');

    return html`<a class="earl" href="${href}">${shortUrl}</a>`;
  }
}

export default Earl;
