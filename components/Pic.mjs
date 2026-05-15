import { h, Component } from '../importmap/preact/src/index.js';
import { useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Pic extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/pic.css'));
  }
  render({ src, sources, scaleable = false, onLoad, aspectRatio }) {
    const [loaded, setLoaded] = useState(false);
    const handleOnLoad = event => {
      setLoaded(true);
      onLoad && onLoad();
    };
    const ratioStyle = aspectRatio && `--pic-aspect-ratio: ${aspectRatio};`;
    return html`<picture class="pic ${scaleable ? 'pic--scaleable' : ''}">
      ${sources &&
      sources.map(source => html`<source srcset=${source.srcSet} sizes="auto" />`)}
      <img class="pic__placeholder ${loaded ? 'pic__placeholder--loaded' : 'pic__placeholder--loading'}" src=${src} loading="lazy" onLoad=${handleOnLoad} style=${ratioStyle} />
    </picture>`;
  }
}

export default Pic;
