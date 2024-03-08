import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Map extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/map/map.css'));
  }
  render({ latitude, longitude }) {
    const src = browser.runtime.getURL(`sidebar/map.html`);
    console.debug(`${src}?${latitude}/${longitude}`);
    return html`<iframe
      class="map"
      src="${src}?${latitude}/${longitude}"
      loading="lazy"></iframe>`;
  }
}

export default Map;
