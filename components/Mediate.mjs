import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { fetchJSON } from '../modules/fetch.mjs';

import {
  useState,
  useEffect,
} from '../importmap/preact/hooks/src/index.js';

import Pic from './Pic.mjs';
import Play from './Play.mjs';
import Watch from './Watch.mjs';

const html = htm.bind(h);

const getAspectRatioFromMediaInfo = (mediaInfo, manager) => {
  const sizeProps = {
    width: manager.wikibase.props?.width,
    height: manager.wikibase.props?.height,
  };
  const pixelProp = manager.wikibase.items.pixel;
  const size = {};
  for (const [dimension, property] of Object.entries(sizeProps)) {
    mediaInfo?.[property]?.forEach(item => {
      if (item.mainsnak.datavalue.value.unit.endsWith(pixelProp)) {
        size[dimension] = Number.parseInt(item.mainsnak.datavalue.value.amount, 10);
      }
    });
  }
  return size.height && size.width ? `${size.width}/${size.height}` : null;
};

const getAspectRatioFromImageInfo = (imageinfo) => {
  return imageinfo.height && imageinfo.width ? `${imageinfo.width}/${imageinfo.height}` : null; 
}

const info = (href, text) => html`<small><a href="${href}">${text}</a></small>`;

class Mediate extends Component {
  render({
    datavalue,
    datatype,
    manager,
    mediaInfo
  }) {
    const fileName = encodeURIComponent(datavalue.value);
    const mediaPrefix = {
      localMedia: `${manager.wikibase.api.instance.root}/index.php?title=Special:Redirect/file/`,
      commonsMedia:
        'https://commons.wikimedia.org/w/index.php?title=Special:FilePath/',
    };
    const hrefPrefix = {
      localMedia: manager.wikibase.api.instance.root,
      commonsMedia: 'https://commons.wikimedia.org/wiki',
    };

    const srcUrl = `${mediaPrefix[datatype]}${fileName}`;
    const href = `${hrefPrefix[datatype]}/File:${fileName}`;
    let image = '';
    let audio = '';
    let video = '';
    let [ aspectRatio, setAspectRatio ] = useState(getAspectRatioFromMediaInfo(mediaInfo, manager));

    useEffect(async () => {
      if (aspectRatio == null && datatype == 'commonsMedia') {
        const { query } = await fetchJSON(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${fileName}&prop=imageinfo&iiprop=size&format=json`);
        const mediaId = Object.keys(query?.pages)[0];
        if (query?.pages[mediaId]) {
          setAspectRatio(getAspectRatioFromImageInfo(query?.pages[mediaId]?.imageinfo?.[0]));
        }
      }
    }, []);

    if (fileName.match(/\.svg$/i)) {
      image = {
        src: srcUrl,
        scaleable: true,
      };
    } else if (fileName.match(/\.(jpe?g|png|webp|gif|tiff?|stl)$/i)) {
      image = {
        src: srcUrl,
        sources: [
          {
            srcSet: [
                130, // minimum sidebar width - minus main padding-block
                168, // minimum sidebar width
                216, // default sidebar width
                250, // minimum sidebar width - minus main padding-block
                260, // minimum sidebar width - minus main padding-block ⨉2
                320, // width offered as 'other resolutions' on commons file page
                336, // minimum sidebar width ⨉2
                432, // default sidebar width ⨉2
                500, // minimum sidebar width - minus main padding-block ⨉2
                640, // width offered as 'other resolutions' on commons file page
                1024, // width offered as 'other resolutions' on commons file page
                1280, // width offered as 'other resolutions' on commons file page
                1920, // default size on commons file page
                2560, // width offered as 'other resolutions' on commons file page
                4032, // width offered as 'other resolutions' on commons file page
              ]
              .map(width => {
                return `${srcUrl}&width=${width}px ${width}w`;
              })
              .join(', '),
          },
        ],
      };
    } else if (fileName.match(/\.(flac|wav|og[ga]|mp3)$/i)) {
      audio = {
        src: srcUrl,
      };
    } else if (fileName.match(/\.webm$/i)) {
      video = {
        src: srcUrl,
        poster: `${srcUrl}&width=501px`,
      };
    }
    const media_info = browser.i18n.getMessage('media_info');
    return html`
      <div class="medius">
        ${image && html`<a href="${href}"><${Pic} ...${image} aspectRatio=${aspectRatio} /></a>`}
        ${audio && html`<${Play} ...${audio} />${info(href, media_info)}`}
        ${video && html`<${Watch} ...${video} />${info(href, media_info)}`}
      </div>
    `;
  };
};

export default Mediate;
