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

  const conceptItems = [];
  if (
    'itemForThisSense' in manager.wikibase.props &&
    manager.wikibase.props.itemForThisSense in sense.claims
  ) {
    for (const claim of sense.claims[manager.wikibase.props.itemForThisSense]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        conceptItems.push(claim.mainsnak.datavalue.value.id);
      }
    }
  }
  if (
    'predicateFor' in manager.wikibase.props &&
    manager.wikibase.props.predicateFor in sense.claims
  ) {
    for (const claim of sense.claims[manager.wikibase.props.predicateFor]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        conceptItems.push(claim.mainsnak.datavalue.value.id);
      }
    }
  }

  const derivedFromItems = [];
  if (
    'semanticDerivationOf' in manager.wikibase.props &&
    manager.wikibase.props.semanticDerivationOf in sense.claims
  ) {
    for (const claim of sense.claims[
      manager.wikibase.props.semanticDerivationOf
    ]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        derivedFromItems.push(claim.mainsnak.datavalue.value.id);
      }
    }
  }

  const genderItems = [];
  if (
    'semanticGender' in manager.wikibase.props &&
    manager.wikibase.props.semanticGender in sense.claims
  ) {
    for (const claim of sense.claims[manager.wikibase.props.semanticGender]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        genderItems.push(
          html`<${Thin}
            id=${claim.mainsnak.datavalue.value.id}
            manager=${manager} />`,
        );
      }
    }
  }

  const contextItems = [];
  if (
    'fieldOfUsage' in manager.wikibase.props &&
    manager.wikibase.props.fieldOfUsage in sense.claims
  ) {
    for (const claim of sense.claims[manager.wikibase.props.fieldOfUsage]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        contextItems.push(
          html`<span class="gloss__use"
            ><${Thin}
              id=${claim.mainsnak.datavalue.value.id}
              manager=${manager}
          /></span>`,
        );
      }
    }
  }
  if (
    'languageStyle' in manager.wikibase.props &&
    manager.wikibase.props.languageStyle in sense.claims
  ) {
    for (const claim of sense.claims[manager.wikibase.props.languageStyle]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        contextItems.push(
          html`<span class="gloss__style"
            ><${Thin}
              id=${claim.mainsnak.datavalue.value.id}
              manager=${manager}
          /></span>`,
        );
      }
    }
  }
  if (
    'locationOfSenseUsage' in manager.wikibase.props &&
    manager.wikibase.props.locationOfSenseUsage in sense.claims
  ) {
    for (const claim of sense.claims[
      manager.wikibase.props.locationOfSenseUsage
    ]) {
      if (claim.mainsnak.datavalue?.value?.id) {
        contextItems.push(
          html`<span class="gloss__style"
            ><${Thin}
              id=${claim.mainsnak.datavalue.value.id}
              manager=${manager}
          /></span>`,
        );
      }
    }
  }

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

  return html`
    <div class="gloss">
      ${contextItems.length
        ? html`<span class="gloss__context"
            >${stylePrefix}${contextItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, styleInterfix, item],
              [],
            )}${styleSuffix}</span
          >`
        : ''}${isNativeGloss
        ? gloss
        : conceptItems.map(
            (item, index) =>
              html`<${Something} id=${item} manager=${manager} />`,
          )}
      ${genderItems.length
        ? html`<span class="gloss__gender">
            ${genderPrefix}${genderItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, genderInterfix, item],
              [],
            )}${genderSuffix}</span
          >`
        : ''}
      ${derivedFromItems.length > 0
        ? html`${derivedFromPrefix}${derivedFromItems.map(
            (item, index) =>
              html`<${Word}
                showLemma="yes"
                showAppendix="no"
                id=${item}
                manager=${manager} />`,
          )}`
        : ''}
      ${conceptItems.length > 0
        ? conceptItems.map(
            (item, index) =>
              html`<br />${itemPrefix}<${Thing}
                  id=${item}
                  manager=${manager} />${itemSuffix}`,
          )
        : ''}
    </div>
  `;
}

export default Gloss;
