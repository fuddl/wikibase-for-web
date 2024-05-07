import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

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
