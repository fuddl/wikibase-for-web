import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';
import Mark from './Mark.mjs';
import Gender from './Gender.mjs';
import Zone from './Zone.mjs';
const html = htm.bind(h);

function Paraphrase({
  id,
  senses,
  manager,
  property,
  excludeLanguage,
  onlyLanguage,
  senseOrdinals,
  query,  
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

        const languageStyles =
          claim.qualifiers?.[manager.wikibase.props.languageStyle]
            ?.map(qualifier => qualifier.datavalue?.value?.id)
            .filter(Boolean) || [];

        const fieldsOfUsage =
          claim.qualifiers?.[manager.wikibase.props.fieldOfUsage]
            ?.map(qualifier => qualifier.datavalue?.value?.id)
            .filter(Boolean) || [];

        return {
          fromSense: sense.id,
          toSense: claim.mainsnak.datavalue.value.id,
          languages,
          semanticGenders,
          languageStyles,
          fieldsOfUsage,
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

      const inferred = [];
      for (const property of ['itemForThisSense', 'predicateFor', 'demonymOf']) {
        for (const sense of senses) {
          // Get values based on type
          const values =
            sense.claims[manager.wikibase.props[property]]?.map(
              claim => claim.mainsnak.datavalue?.value?.id,
            ) || [];

          if (values.length === 0) continue;

          // Query for the property values
          let result = await manager.query(
            manager.wikibase.id,
            query,
            {
              property,
              values: values.map(value => value.replace(/^[^\:]+\:/, '')),
              languages: manager.wikibase.languages,
              excludeLanguage: excludeLanguage?.replace(/^[^\:]+\:/, ''),
              onlyLanguage: onlyLanguage?.replace(/^[^\:]+\:/, ''),
            },
          );

          // if the current sense has a semantic gender, filter all result items that don't have the same semantic gender
          if (sense.claims[manager.wikibase.props.semanticGender]?.length) {
            const semanticGenders = sense.claims[
              manager.wikibase.props.semanticGender
            ].map(claim => claim.mainsnak.datavalue?.value?.id);
            result = result.filter(item => {
              // filter items that don't have the same semantic gender but keep those that have no gender
              if (item.semanticGenders.length > 0) {
                return item.semanticGenders.some(gender =>
                  semanticGenders.includes(gender),
                );
              } else {
                return true;
              }
            });
            // there is no need the display the semantic gender anymore so we remove it from the result items
            result = result.map(item => ({
              ...item,
              semanticGenders: [],
            }));
          }

          // Process each result item
          result.forEach(item => {
            if (sense.id != item.sense) {
              inferred.push({
                fromSense: sense.id,
                toSense: item.sense,
                languages: item.languages,
                semanticGenders: item.semanticGenders,
                languageStyles: item.languageStyles,
                fieldsOfUsage: item.fieldsOfUsage,
              });
            }
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

  const wrapper = languages.length > 0 ? 'dl' : 'div';
  const wordsWrapper = languages.length > 0 ? 'dd' : 'div';

  if (!senses?.length) {
    return '';
  }

  // group allItems by fieldsOfUsage and languageStyles
  const groupedItems = allItems.reduce((acc, item) => {
    let key = [
      ...new Set([
        ...(item?.fieldsOfUsage ?? []),
        ...(item?.languageStyles ?? []),
      ]),
    ]
      .sort()
      .join('|');
    // if key is empty, set it to 'unknown'
    if (key === '') {
      key = 'none';
    }
    acc[key] = acc[key] || { items: [] };
    acc[key].items.push(item);
    acc[key].fieldsOfUsage = item.fieldsOfUsage;
    acc[key].languageStyles = item.languageStyles;
    return acc;
  }, {});

  return html`
    <section class="paraphrase">
      <h2 class="paraphrase__title">
        <${Thing}
          id=${`${manager.wikibase.id}:${manager.wikibase.props[property]}`}
          manager=${manager} />
      </h2>
      <div
        class="paraphrase__list paraphrase__list--amount_${languages.length}">
        ${languages.map(
          language => html`
          <${wrapper} class="paraphrase__group" key=${`${id}:${language}`}>
            ${
              languages.length > 0 &&
              html` <dt
                class="paraphrase__lang ${onlyLanguage == language
                  ? 'paraphrase__lang--only'
                  : ''}"
                key=${`${id}:${language}-dt`}>
                ${language === 'unknown'
                  ? 'Other'
                  : html`<${Thing} id=${language} manager=${manager} />`}
              </dt>`
            }
              ${senses.map(sense => {
                const senseGroups = Object.values(groupedItems)
                  .filter(group =>
                    group.items.some(
                      item =>
                        item.fromSense === sense.id &&
                        (language === 'unknown'
                          ? item.languages.length === 0
                          : item.languages.includes(language)),
                    ),
                  )
                  .map(group => {
                    // Calculate similarity score
                    let score = 0;

                    // Get current sense's fieldsOfUsage and languageStyles
                    const currentFieldsOfUsage =
                      sense.claims[manager.wikibase.props.fieldOfUsage]?.map(
                        claim => claim.mainsnak.datavalue?.value?.id,
                      ) || [];
                    const currentLanguageStyles =
                      sense.claims[manager.wikibase.props.languageStyle]?.map(
                        claim => claim.mainsnak.datavalue?.value?.id,
                      ) || [];

                    if (
                      !group.fieldsOfUsage ||
                      group.fieldsOfUsage.length === 0
                    ) {
                      score += 1;
                    }
                    if (
                      !group.languageStyles ||
                      group.languageStyles.length === 0
                    ) {
                      score += 1;
                    }

                    // Add 1 point for each common fieldOfUsage
                    if (
                      group.fieldsOfUsage?.length &&
                      currentFieldsOfUsage.length
                    ) {
                      score +=
                        group.fieldsOfUsage.filter(field =>
                          currentFieldsOfUsage.includes(field),
                        ).length * 1.5;
                    }

                    // Add 2 points for each common languageStyle
                    if (
                      group.languageStyles?.length &&
                      currentLanguageStyles.length
                    ) {
                      score +=
                        group.languageStyles.filter(style =>
                          currentLanguageStyles.includes(style),
                        ).length * 2;
                    }

                    return { ...group, score };
                  })
                  .sort((a, b) => b.score - a.score);

                if (senseGroups.length === 0) return null;

                return html`
                  <${wordsWrapper}
                    class="paraphrase__words"
                    key=${`${id}:${language}:${sense.id}-dd`}>
                    ${senses.length > 1 && html`<${Mark} ordinal=${senseOrdinals[sense.id]} />`}
                    <span class="paraphrase__items">
                      ${senseGroups.map(
                        (group, index) => html`
                          ${index > 0 ? '; ' : ''}
                          ${group.fieldsOfUsage?.length ||
                          group.languageStyles?.length
                            ? html`<${Zone}
                                fieldsOfUsage=${group.fieldsOfUsage}
                                languageStyles=${group.languageStyles}
                                manager=${manager} />`
                            : null}${group.items
                            .filter(
                              item =>
                                item.fromSense === sense.id &&
                                (language === 'unknown'
                                  ? item.languages.length === 0
                                  : item.languages.includes(language)),
                            )
                            .map(
                              item =>
                                html`<${Word}
                                    id=${item.toSense}
                                    key=${item.toSense}
                                    manager=${manager}
                                    showLemma="yes"
                                    showAppendix="no" />
                                  ${item.semanticGenders.length > 0 &&
                                  html`<${Gender}
                                    items=${item.semanticGenders}
                                    manager=${manager} />`}`,
                            )
                            .reduce((acc, curr, index) => {
                              if (index === 0) return curr;
                              return html`${acc}, ${curr}`;
                            }, '')}
                        `,
                      )}
                    </span>
                  </${wordsWrapper}>
                `;
              })}
          </${wrapper}>
        `,
        )}
      </div>
    </section>
  `;
}

export default Paraphrase;
