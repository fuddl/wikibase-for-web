import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

function getBbox(lat, lon, precision) {
  const padding = Math.max(precision, 0.002); 

  const minLat = lat - padding;
  const maxLat = lat + padding;
  const minLon = lon - padding;
  const maxLon = lon + padding;

  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

class Map extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/map.css'));
  }
  render({ latitude, longitude, precision }) {
    const src = browser.runtime.getURL(`sidebar/map.html`);
    return html`<iframe
      class="map"
      src="https://www.openstreetmap.org/export/embed.html?layer=shortbread&marker=${latitude},${longitude}&bbox=${getBbox(latitude, longitude, precision)}&controls=false&attribution=minimal"
      loading="lazy"></iframe>`;
  }
}

export default Map;
