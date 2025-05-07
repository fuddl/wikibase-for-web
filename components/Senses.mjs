import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Show from './Show.mjs';
import Grasp from './Grasp.mjs';
import Paraphrase from './Paraphrase.mjs';

const html = htm.bind(h);

/**
 * Senses component to display sense information, images, translations, synonyms, etc.
 * 
 * @param {Object} props Component props
 * @param {Array} props.senses Array of sense objects
 * @param {Object} props.manager Wikibase entity manager
 * @param {Object} props.senseOrdinals Map of sense IDs to ordinals
 * @param {string} props.language Current language
 * @param {string} props.id Entity ID
 */
function Senses({ senses, manager, senseOrdinals, language, id }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/senses.css'));
  }, []);

  if (!senses) return null;

  // Function to extract image items from senses
  const getImageItems = () => {
    if (!senses || !manager?.wikibase?.props?.image) return [];
    
    const imageItems = [];
    const imageProperty = manager.wikibase.props.image;
    const mediaLegendProperty = manager.wikibase.props.mediaLegend;
    
    senses.forEach(sense => {
      if (sense.claims && imageProperty in sense.claims) {
        const images = sense.claims[imageProperty] || [];
        images.forEach(claim => {
          if (claim.mainsnak?.datavalue?.value) {
            const fileName = encodeURIComponent(claim.mainsnak.datavalue.value);
            if (fileName.match(/\.(jpe?g|png|webp|gif|svg|tiff?)$/i)) {
              // Extract caption from mediaLegend qualifier if available
              let caption = null;
              if (mediaLegendProperty && claim.qualifiers && mediaLegendProperty in claim.qualifiers) {
                const legendQualifiers = claim.qualifiers[mediaLegendProperty];
                if (legendQualifiers && legendQualifiers.length > 0) {
                  // Since it's always monolingualtext, handle appropriately
                  // First try to find a qualifier with language matching navigator.languages
                  const navigatorLanguages = navigator.languages || [navigator.language];
                  
                  // Try to find a text in user's preferred languages
                  let matchedQualifier = null;
                  
                  // Start with exact match
                  for (const lang of navigatorLanguages) {
                    matchedQualifier = legendQualifiers.find(q => 
                      q.datavalue?.value?.language === lang
                    );
                    if (matchedQualifier) break;
                  }
                  
                  // If no exact match, try to match language base (en-US -> en)
                  if (!matchedQualifier) {
                    for (const lang of navigatorLanguages) {
                      const baseLang = lang.split('-')[0];
                      matchedQualifier = legendQualifiers.find(q => 
                        q.datavalue?.value?.language && q.datavalue?.value?.language.startsWith(baseLang)
                      );
                      if (matchedQualifier) break;
                    }
                  }
                  
                  // If still no match, just use the first qualifier
                  if (!matchedQualifier && legendQualifiers.length > 0) {
                    matchedQualifier = legendQualifiers.find(q => 
                      q.datavalue?.value?.text
                    );
                  }
                  
                  // Extract the text from the matched qualifier
                  if (matchedQualifier && matchedQualifier.datavalue?.value?.text) {
                    caption = matchedQualifier.datavalue.value.text;
                  }
                }
              }
              
              imageItems.push({
                fileName,
                marker: senses.length > 1 ? senseOrdinals?.[sense.id] || null : null,
                caption
              });
            }
          }
        });
      }
    });
    
    return imageItems;
  };

  const imageItems = getImageItems();

  return html`
    <${Grasp} senses=${senses} manager=${manager} senseOrdinals=${senseOrdinals} />
    
    ${imageItems.length > 0 && html`
    <${Show} 
        imageItems=${imageItems} 
        targetRowAspectRatio=${2} 
        key=${manager.wikibase.props.image}
    />
    `}
    
    ${[
    { property: 'translation', excludeLanguage: language, query: 'inferredSenses' },
    { property: 'synonym', onlyLanguage: language, query: 'inferredSenses' },
    { property: 'hyperonym', onlyLanguage: language, query: 'hyperonyms' },
    ].map(
    type => html`
        <${Paraphrase}
        id=${id}
        key=${type.property}
        senses=${senses}
        manager=${manager}
        property=${type.property}
        excludeLanguage=${type?.excludeLanguage}
        onlyLanguage=${type?.onlyLanguage}
        senseOrdinals=${senseOrdinals}
        query=${type.query} />
    `,
    )}
  `;
}

export default Senses; 