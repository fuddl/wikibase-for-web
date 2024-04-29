import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';

const html = htm.bind(h);

class Play extends Component {
  render({ src }) {
    return html`<audio class="play" src=${src} preload="none" controls />`;
  }
}

export default Play;
