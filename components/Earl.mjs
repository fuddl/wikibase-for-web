import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Earl extends Component {
  render({ value: href }) {
    const shortUrl = href
      .replace(/^[a-z]+\:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/index\.(php|html?)$/, '')
      .replace(/\/$/, '');

    return html`<a href="${href}">${shortUrl}</a>`;
  }
}

export default Earl;
