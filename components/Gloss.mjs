import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thin from './Thin.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';
import Something from './Something.mjs';

const html = htm.bind(h);

function Gloss({ sense, manager }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/gloss.css'));
  }, []);

  const { language: lang, value: gloss } = getByUserLanguage(sense.glosses);
  const isNativeGloss = document.documentElement.lang.startsWith(lang);

  // Helper to extract claim IDs for a given set of property keys
  const extractClaimIds = propKeys => {
    const ids = [];
    propKeys.forEach(key => {
      if (key in manager.wikibase.props) {
        const prop = manager.wikibase.props[key];
        if (prop in sense.claims) {
          sense.claims[prop].forEach(claim => {
            const id = claim.mainsnak.datavalue?.value?.id;
            if (id) ids.push(id);
          });
        }
      }
    });
    return ids;
  };

  // Helper to extract components from a claim using a given component and optional CSS wrapper
  const extractClaimComponents = (propKey, Component, wrapperClass = null) => {
    const items = [];
    if (propKey in manager.wikibase.props) {
      const prop = manager.wikibase.props[propKey];
      if (prop in sense.claims) {
        sense.claims[prop].forEach(claim => {
          const id = claim.mainsnak.datavalue?.value?.id;
          if (id) {
            const element = wrapperClass
              ? html`<span class="${wrapperClass}"
                  ><${Component} id=${id} manager=${manager}
                /></span>`
              : html`<${Component} id=${id} manager=${manager} />`;
            items.push(element);
          }
        });
      }
    }
    return items;
  };

  // Use the helpers for the different claim groups
  const conceptItems = extractClaimIds(['itemForThisSense', 'predicateFor']);
  const derivedFromItems = extractClaimIds(['semanticDerivationOf']);
  const genderItems = extractClaimComponents('semanticGender', Thin);
  const transitivityItems = extractClaimComponents('transitivity', Thin);

  // For context items, we have different CSS classes depending on the property.
  const contextMapping = {
    fieldOfUsage: 'gloss__use',
    languageStyle: 'gloss__style',
    locationOfSenseUsage: 'gloss__style',
  };
  let contextItems = [];
  Object.entries(contextMapping).forEach(([propKey, cssClass]) => {
    contextItems = contextItems.concat(
      extractClaimComponents(propKey, Thin, cssClass),
    );
  });

  // Internationalization messages (with placeholder splitting)
  const placeholder = '￼';
  const [stylePrefix, styleInterfix, styleSuffix] = browser.i18n
    .getMessage('gloss_style_format', [placeholder, placeholder])
    .split(placeholder);
  const [genderPrefix, genderInterfix, genderSuffix] = browser.i18n
    .getMessage('gloss_gender_format', [placeholder, placeholder])
    .split(placeholder);
  const [itemPrefix, itemSuffix] = browser.i18n
    .getMessage('gloss_item_format', [placeholder])
    .split(placeholder);
  const [transitivityPrefix, transitivityInterfix, transitivitySuffix] =
    browser.i18n
      .getMessage('gloss_transitivity_format', [placeholder])
      .split(placeholder);

  return html`
    <div class="gloss">
      ${contextItems.length
        ? html`<span class="gloss__context">
            ${stylePrefix}${contextItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, styleInterfix, item],
              [],
            )}${styleSuffix}
          </span>`
        : ''}
      ${transitivityItems.length
        ? html`<span class="gloss__transitivity">
            ${transitivityPrefix}${transitivityItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, transitivityInterfix, item],
              [],
            )}${transitivitySuffix}
          </span>`
        : ''}
      ${isNativeGloss
        ? gloss
        : conceptItems.map(
            item => html`<${Something} id=${item} manager=${manager} />`,
          )}
      ${genderItems.length
        ? html`<span class="gloss__gender">
            ${genderPrefix}${genderItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, genderInterfix, item],
              [],
            )}${genderSuffix}
          </span>`
        : ''}
      ${derivedFromItems.length > 0
        ? html`${derivedFromPrefix}${derivedFromItems.map(
            item =>
              html`<${Word}
                showLemma="yes"
                showAppendix="no"
                id=${item}
                manager=${manager} />`,
          )}`
        : ''}
      ${conceptItems.length > 0
        ? conceptItems.map(
            item =>
              html`<br />${itemPrefix}<${Thing}
                  id=${item}
                  manager=${manager} />${itemSuffix}`,
          )
        : ''}
    </div>
  `;
}

export default Gloss;
