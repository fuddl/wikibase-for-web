import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Pic extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/pic.css'));
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
