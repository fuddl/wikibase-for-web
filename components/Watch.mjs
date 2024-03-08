import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Watch extends Component {
  render({ src, poster }) {
    return html`<video
      class="watch"
      src=${src}
      preload="none"
      poster=${poster}
      controls />`;
  }
}

export default Watch;
