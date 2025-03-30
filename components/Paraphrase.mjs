import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';

const html = htm.bind(h);

function Paraphrase({
  id,
  senses,
  manager,
  property,
  excludeLanguage,
  onlyLanguage,
}) {
  const [inferredItems, setInferredItems] = useState({});

  const directItems = senses
    .map(sense => {
      const claims = sense.claims[manager.wikibase.props[property]] || [];
      return claims.map(claim => {
        const languages =
          claim.qualifiers?.[manager.wikibase.props.languageOfWorkOrName]
            ?.map(qualifier => qualifier.datavalue?.value?.id)
            .filter(Boolean) || [];
        const semanticGenders =
          claim.qualifiers?.[manager.wikibase.props.semanticGender]
            ?.map(qualifier => qualifier.datavalue?.value?.id)
            .filter(Boolean) || [];

        return {
          fromSense: sense.id,
          toSense: claim.mainsnak.datavalue.value.id,
          languages,
          semanticGenders,
        };
      });
    })
    .flat();

  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/paraphrase.css'));
  }, []);

  useEffect(() => {
    async function fetchInferredItems() {
      if (!senses?.length) return;

      const results = {};
      const inferred = [];
      for (const property of ['itemForThisSense', 'predicateFor']) {
        for (const sense of senses) {
          // Get values based on type
          const values =
            sense.claims[manager.wikibase.props[property]]?.map(
              claim => claim.mainsnak.datavalue?.value?.id,
            ) || [];

          if (values.length === 0) continue;

          // Query for the property values
          const result = await manager.query(
            manager.wikibase.id,
            'inferredSenses',
            {
              property,
              values: values.map(value => value.replace(/^[^\:]+\:/, '')),
              languages: manager.wikibase.languages,
              excludeLanguage: excludeLanguage?.replace(/^[^\:]+\:/, ''),
              onlyLanguage: onlyLanguage?.replace(/^[^\:]+\:/, ''),
            },
          );

          // Process each result item
          result.forEach(item => {
            inferred.push({
              //item: values.map(value => value.replace(/^[^\:]+\:/, '')),
              fronSense: sense.id,
              toSense: item.sense,
              languages: [item.language],
              semanticGenders: (item.semanticGenders || []).map(
                g => `${manager.wikibase.id}:${g}`,
              ),
            });
          });
        }

        setInferredItems(inferred);
      }
    }

    fetchInferredItems();
  }, [senses, manager, excludeLanguage, onlyLanguage]);

  // Merge directItems and inferredItems where fromSense and toSense are the same
  const allItems = [...directItems];
  if (inferredItems.length > 0) {
    inferredItems.forEach(inferred => {
      const existingIndex = allItems.findIndex(
        direct =>
          direct.fromSense === inferred.fromSense &&
          direct.toSense === inferred.toSense,
      );

      if (existingIndex >= 0) {
        // Merge languages and semanticGenders
        allItems[existingIndex] = {
          ...allItems[existingIndex],
          languages: [
            ...new Set([
              ...allItems[existingIndex].languages,
              ...inferred.languages,
            ]),
          ],
          semanticGenders: [
            ...new Set([
              ...allItems[existingIndex].semanticGenders,
              ...inferred.semanticGenders,
            ]),
          ],
        };
      } else {
        // Add new item if no match found
        allItems.push(inferred);
      }
    });
  }

  if (allItems.length === 0) {
    return '';
  }

  // Get all unique languages and add 'unknown' for items without languages
  const languages = [...new Set(allItems.map(item => item.languages).flat())];
  if (allItems.some(item => item.languages.length === 0)) {
    languages.push('unknown');
  }

  return html`
    <h3>
      <${Thing}
        id=${`${manager.wikibase.id}:${manager.wikibase.props[property]}`}
        manager=${manager} />
    </h3>
    <div class="paraphrase">
      ${languages.map(
        language => html`
          <dl class="paraphrase__group" key=${`${id}:${language}`}>
            <dt class="paraphrase__lang" key=${`${id}:${language}-dt`}>
              ${language === 'unknown'
                ? 'Other'
                : html`<${Thing} id=${language} manager=${manager} />`}
            </dt>
            <dd class="paraphrase__words" key=${`${id}:${language}-dd`}>
              ${allItems
                .filter(item =>
                  language === 'unknown'
                    ? item.languages.length === 0
                    : item.languages.includes(language),
                )
                .map(
                  (item, index, array) => html`
                    <${Word}
                      id=${item.toSense}
                      key=${item.toSense}
                      manager=${manager}
                      showLemma="yes"
                      showAppendix="no" />
                    ${index < array.length - 1 ? ', ' : ''}
                  `,
                )}
            </dd>
          </dl>
        `,
      )}
    </div>
  `;
}

export default Paraphrase;
