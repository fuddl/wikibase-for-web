import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import Pic from './Pic.mjs';
import Play from './Play.mjs';
import Watch from './Watch.mjs';

const html = htm.bind(h);

const info = (href, text) => html`<small><a href="${href}">${text}</a></small>`;

const Mediate = ({ datavalue, datatype, manager }) => {
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
          srcSet: [250, 501, 801, 1068]
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
      ${image && html`<a href="${href}"><${Pic} ...${image} /></a>`}
      ${audio && html`<${Play} ...${audio} />${info(href, media_info)}`}
      ${video && html`<${Watch} ...${video} />${info(href, media_info)}`}
    </div>
  `;
};

export default Mediate;
