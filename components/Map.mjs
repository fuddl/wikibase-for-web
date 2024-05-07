import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Map extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/map.css'));
  }
  render({ latitude, longitude }) {
    const src = browser.runtime.getURL(`sidebar/map.html`);
    return html`<iframe
      class="map"
      src="${src}?${latitude}/${longitude}"
      loading="lazy"></iframe>`;
  }
}

export default Map;
