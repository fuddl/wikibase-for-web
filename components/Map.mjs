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

  return [minLon, minLat, maxLon, maxLat];
}

function widenBbox(bbox, amount = 0.01) {
  if (!bbox) return bbox;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const width = Math.abs(maxLon - minLon);
  const height = Math.abs(maxLat - minLat);
  const padding = Math.max(width, height) * amount;
  return [minLon - padding, minLat - padding, maxLon + padding, maxLat + padding];
}

function narrowBbox(bbox, amount = 0.01) {
  if (!bbox) return bbox;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const width = Math.abs(maxLon - minLon);
  const height = Math.abs(maxLat - minLat);
  const padding = Math.max(width, height) * amount;
  return [minLon + padding, minLat + padding, maxLon - padding, maxLat - padding];
}

function bboxAspectRatio(bbox) {
  if (bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const width = Math.abs(maxLon - minLon);
    const height = Math.abs(maxLat - minLat);
    if (height > 0) {
      // Calculate visual aspect ratio for Web Mercator projection
      const midLat = (minLat + maxLat) / 2;
      const ratio = (width * Math.cos(midLat * Math.PI / 180)) / height;
      return ratio;
    }
  }
  return '';
}

class Map extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/map.css'));
  }
  render({ latitude, longitude, precision, bbox = null, manager, contextId }) {
    const src = browser.runtime.getURL(`sidebar/map.html`);

    const [mapBbox, setMapBbox] = useState(bbox);
    const [aspectRatio, setAspectRatio] = useState(bboxAspectRatio(mapBbox));

    useEffect(() => {
      if (bbox) {
        setMapBbox(bbox);
        return;
      }

      const doFetch = async () => {
        const boundingBoxes = await manager.queryManager.query(
          manager.wikibase,
          manager.queryManager.queries.parentGeoRegions,
          { item: contextId.split(':')[1] },
        );
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const filtered = (boundingBoxes || []).filter(region => {
          if (!region.bbox) return false;
          const [minLon, minLat, maxLon, maxLat] = narrowBbox(region.bbox, 0.1);
          if (lat < minLat || lat > maxLat) return false;
          if (minLon <= maxLon) {
            return lon >= minLon && lon <= maxLon;
          } else {
            return lon >= minLon || lon <= maxLon;
          }
        });
        console.debug(filtered)
        if (filtered.length > 0) {
          setMapBbox(filtered[0].bbox);
        } else {
          setMapBbox(getBbox(latitude, longitude, precision));
        }
      };

      if (contextId) {
        doFetch();
      } else {
        setMapBbox(getBbox(latitude, longitude, precision));
      }
    }, [latitude, longitude, contextId, precision, bbox]);

    useEffect(() => {
      setAspectRatio(bboxAspectRatio(mapBbox))
    }, [mapBbox]);

    return html`<iframe
      key=${`${latitude},${longitude}`}
      class="map"
      style=${`--intrinisic-aspectratio: ${aspectRatio}` || null}
      src="https://www.openstreetmap.org/export/embed.html?layer=shortbread&marker=${latitude},${longitude}&bbox=${widenBbox(mapBbox) ?? ''}&controls=false&attribution=minimal&zoomDisabled=true"
      loading="lazy"></iframe>`;
  }
}

export default Map;
