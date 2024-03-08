import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Play extends Component {
  render({ src }) {
    return html`<audio class="play" src=${src} preload="none" controls />`;
  }
}

export default Play;
