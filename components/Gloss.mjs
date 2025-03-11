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

function getFormattingOptions(languageCode) {
  const defaultOptions = {
    bracketOpen: '[',
    bracketClose: '] ',
    languageElement: 'span',
    fieldOfUseElement: 'span',
    seperator: ', ',
    glossLinkPrefix: '→ ',
    derivedFromPrefix: ' ←',
    genderBracketOpen: ' (',
    genderBracketClose: ')',
  };

  const groups = [
    {
      // Latin-based languages (e.g., English, French, Spanish, German, Italian, Portuguese, Vietnamese)
      languages: ['en', 'fr', 'es', 'de', 'it', 'pt', 'vi'],
      options: {
        bracketOpen: '[',
        bracketClose: '] ',
        seperator: ', ',
        derivedFromPrefix: ' ←',
        glossLinkPrefix: '→ ',
        genderBracketOpen: ' (',
        genderBracketClose: ')',
      },
    },
    {
      // Cyrillic-based languages (e.g., Russian, Bulgarian, Ukrainian, Serbian, Macedonian, Mongolian in Cyrillic)
      languages: ['ru', 'bg', 'uk', 'sr', 'mk', 'mn'],
      options: {
        bracketOpen: '(',
        bracketClose: ')',
        seperator: ',',
        derivedFromPrefix: ' ← ',
        glossLinkPrefix: '→ ',
        genderBracketOpen: ' (',
        genderBracketClose: ')',
      },
    },
    {
      // East Asian languages (Chinese, Japanese, Korean)
      languages: ['zh', 'ja', 'ko'],
      options: {
        bracketOpen: '〈',
        bracketClose: '〉',
        seperator: '、',
        derivedFromPrefix: '　→　',
        glossLinkPrefix: '〜',
        genderBracketOpen: '（',
        genderBracketClose: '）',
      },
    },
    {
      // Right-to-left languages (Arabic, Hebrew, Persian, Urdu, Pashto)
      languages: ['ar', 'he', 'fa', 'ur', 'ps'],
      options: {
        bracketOpen: '(',
        bracketClose: ')',
        seperator: ',',
        derivedFromPrefix: ' ⇐',
        glossLinkPrefix: ' ←', // left-pointing arrow for RTL reading
        genderBracketOpen: '(',
        genderBracketClose: ')',
      },
    },
    {
      // Indic languages (Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Oriya, Nepali)
      languages: ['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'or', 'ne', 'pa'],
      options: {
        bracketOpen: '(',
        bracketClose: ') ',
        seperator: ', ',
        derivedFromPrefix: ' ←',
        glossLinkPrefix: '– ',
        genderBracketOpen: ' (',
        genderBracketClose: ')',
      },
    },
    {
      // Southeast Asian languages (Thai, Lao, Burmese, Khmer)
      languages: ['th', 'lo', 'my', 'km'],
      options: {
        bracketOpen: '(',
        bracketClose: ')',
        seperator: ',',
        derivedFromPrefix: '→ ',
        glossLinkPrefix: '→ ',
        genderBracketOpen: '(',
        genderBracketClose: ')',
      },
    },
    {
      // Caucasian languages (Georgian and Armenian)
      languages: ['ka', 'hy'],
      options: {
        bracketOpen: '(',
        bracketClose: ')',
        seperator: ',',
        derivedFromPrefix: '→ ',
        glossLinkPrefix: '→ ',
        genderBracketOpen: '(',
        genderBracketClose: ')',
      },
    },
    {
      // Ethiopic languages (e.g., Amharic, Tigrinya)
      languages: ['am', 'ti'],
      options: {
        bracketOpen: '(',
        bracketClose: ')',
        seperator: ',',
        derivedFromPrefix: ' ⇐',
        languageElement: 'span',
        fieldOfUseElement: 'span',
        glossLinkPrefix: '→ ',
        genderBracketOpen: '(',
        genderBracketClose: ')',
      },
    },
  ];

  for (const group of groups) {
    if (group.languages.includes(languageCode)) {
      return group.options;
    }
  }
  return defaultOptions;
}

function Gloss({ sense, manager }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/gloss.css'));
  }, []);

  const {
    bracketOpen,
    bracketClose,
    genderBracketOpen,
    genderBracketClose,
    languageElement,
    glossLinkPrefix,
    seperator,
    derivedFromPrefix,
  } = getFormattingOptions(document.documentElement.lang);

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

  return html`
    <div class="gloss">
      ${contextItems.length
        ? html`<span class="gloss__context"
            >${bracketOpen}${contextItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, seperator, item],
              [],
            )}${bracketClose}</span
          >`
        : ''}
      ${isNativeGloss
        ? gloss
        : conceptItems.map(
            (item, index) =>
              html`<${Something} id=${item} manager=${manager} />`,
          )}
      ${genderItems.length
        ? html`<span class="gloss__gender">
            ${genderBracketOpen}${genderItems.reduce(
              (acc, item, index) =>
                index === 0 ? [item] : [...acc, seperator, item],
              [],
            )}${genderBracketClose}</span
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
              html`<br />${glossLinkPrefix}<${Thing}
                  id=${item}
                  manager=${manager} />`,
          )
        : ''}
    </div>
  `;
}

export default Gloss;
