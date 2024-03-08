import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

const html = htm.bind(h);

class Pic extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/pic.css'));
  }
  render({ src, sources, scaleable }) {
    return html`<picture class="pic ${scaleable && 'pic--scaleable'}">
      ${sources &&
      sources.map(source => {
        html`<source srcset=${source.srcSet} />`;
      })}
      <img class="pic__placeholder" src=${src} loading="lazy" />
    </picture>`;
  }
}

export default Pic;
