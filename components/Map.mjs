import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
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
  render({ latitude, longitude, precision, bbox = null, manager, contextId }) {
    const src = browser.runtime.getURL(`sidebar/map.html`);

    const [mapBbox, setMapBbox] = useState(bbox);

    useEffect(() => {
      const doFetch = async () => {
        const boundingBoxes = await manager.queryManager.query(
          manager.wikibase,
          manager.queryManager.queries.parentGeoRegions,
          { item: contextId.split(':')[1] },
        );
        if (boundingBoxes && boundingBoxes.length > 0) {
          setMapBbox(boundingBoxes[0].bbox);
        } else {
          setMapBbox(getBbox(latitude, longitude, precision));
        }
      };

      if (!mapBbox) {
        if (contextId) {
          doFetch();
        } else {
          setMapBbox(getBbox(latitude, longitude, precision));
        }
      }
    }, []);

    let style = '';
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      const width = Math.abs(maxLon - minLon);
      const height = Math.abs(maxLat - minLat);
      if (height > 0) {
        // Calculate visual aspect ratio for Web Mercator projection
        const midLat = (minLat + maxLat) / 2;
        const ratio = (width * Math.cos(midLat * Math.PI / 180)) / height;
        style = `--intrinisic-aspectratio: ${ratio};`;
      }
    }

    return html`<iframe
      class="map"
      style=${style || null}
      src="https://www.openstreetmap.org/export/embed.html?layer=shortbread&marker=${latitude},${longitude}&bbox=${mapBbox ?? ''}&controls=false&attribution=minimal"
      loading="lazy"></iframe>`;
  }
}

export default Map;
