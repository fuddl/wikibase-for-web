import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Pic extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/pic.css'));
  }
  render({ src, sources, scaleable, onLoad }) {
    return html`<picture class="pic ${scaleable && 'pic--scaleable'}">
      ${sources &&
      sources.map(source => {
        html`<source srcset=${source.srcSet} />`;
      })}
      <img class="pic__placeholder" src=${src} loading="lazy" onLoad=${onLoad} />
    </picture>`;
  }
}

export default Pic;
