import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Tempus extends Component {
  render({ text, language }) {
    const calendar = null;
    return html`<time class="tempus" datetime="${'datetime'}">
      <span class="tempus__main">{{ localised }}</span>
      ${calendar &&
      html`<br /><small>{% include 'thing' with calendar %}</small>`}
    </time>`;
  }
}

export default Tempus;
