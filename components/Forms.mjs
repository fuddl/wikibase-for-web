import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';

const html = htm.bind(h);

const formTableLayouts = {
  englishNoun: {
    requiredLanguage: 'english',
    requiredLexicalCategory: 'noun',
    layout: {
      header: [
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { queryForms: { requireFeature: [ 'singular'] } },
            { queryForms: { requireFeature: [ 'plural'] } },
          ],
        ],
      },
    }
  },
  englishVerb: {
    requiredLanguage: 'english',
    requiredLexicalCategory: 'verb',
    layout: {
      header: [
        { label: 'grammaticalTense' },
        { label: 'grammaticalPerson', type: 'prefixHeader' },
        { label: 'linguisticForm' },
      ],
      groups: {
        simplePresent: [
          [
            { label: 'simplePresent', type: 'header', rowspan: 2 },
            { text: 'I, you, they ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'simplePresent' ], excludeFeature: [ 'thirdPerson' ] } },
          ],
          [
            { text: 'he, she, it ', type: 'prefix' },
            { queryForms: { requireFeature: ['singular', 'simplePresent', 'thirdPerson']}}
          ],
        ],
        simplePast: [
          [
            { label: 'simplePast', type: 'header' },
            { type: 'prefix' },
            { queryForms: { requireFeature: ['simplePast']}}
          ]
        ],
        presentParticiple: [
          [
            { label: 'presentParticiple', type: 'header' },
            { type: 'prefix' },
            { queryForms: { requireFeature: ['presentParticiple']}}
          ]
        ],
        pastParticiple: [
          [
            { label: 'pastParticipleEn', type: 'header' },
            { type: 'prefix' },
            { queryForms: { requireFeature: ['pastParticipleEn']}}
          ]
        ]
      },
    }, 
  },
  englishAdjective: {
    requiredLanguage: 'english',
    requiredLexicalCategory: 'adjective',
    layout: {
      header: [
        { label: 'positive' },
        { label: 'comparative' },
        { label: 'superlative' },
      ],
      groups: {
        deklination: [
          [
            { queryForms: { requireFeature: [ 'positive'] } },
            { queryForms: { requireFeature: [ 'comparative'] } },
            { queryForms: { requireFeature: [ 'superlative'] } },
          ],
        ],
      },
    }
  },
  germanNounMale: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'noun',
    requiredClaims: [{ property: 'grammaticalGender', item: 'masculine' }], 
    caption: 'Male noun',
    layout: {
      header: [
        { label: 'case' },
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { label: 'nominativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'der ' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'des ' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'dem ' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'den ' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ' },
          ],
        ],
      },
    }
  },
  germanNounFemale: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'noun',
    requiredClaims: [{ property: 'grammaticalGender', item: 'feminine' }], 
    caption: 'Female noun',
    layout: {
      header: [
        { label: 'case' },
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { label: 'nominativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'die ' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'der ' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'der ' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'die ' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ' },
          ],
        ],
      },
    }
  },
  germanNounNeuter: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'noun',
    requiredClaims: [{ property: 'grammaticalGender', item: 'neuter' }], 
    caption: 'Neuter noun',
    layout: {
      header: [
        { label: 'case' },
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { label: 'nominativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'das ' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'des ' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'dem ' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'das ' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ' },
          ],
        ],
      },
    }
  },
  germanVerbBasic: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'verb',
    layout: {
      header: [
        { },
        { label: 'grammaticalPerson', type: 'prefixHeader' },
        { label: 'linguisticForm' },
      ],
      groups: {
        presentTense: [
          [
            { label: 'presentTense', type: 'header', rowspan: 3 },
            { text: 'ich ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: 'du ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: 'er/sie/es ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
        ],
        preterite: [
          [
            { label: 'preterite', type: 'header' },
            { text: 'ich ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'preterite', 'indicative'] } },
          ],
        ],
        subjunctiveII: [
          [
            { label: 'subjunctiveII', type: 'header' },
            { text: 'ich ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveII'] } },
          ],
        ],
        imperative: [
          [
            { label: 'imperative', type: 'header', rowspan: 2 },
            { text: 'du, ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'singular', 'imperative'] }, formSuffix: '!' },
          ],
          [
            { text: 'ihr, ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'plural', 'imperative'] }, formSuffix: '!' },
          ],
         ],
         perfect: [
          [
            { label: 'perfect', type: 'header', rowspan: 2 },
            { label: 'pastParticiple', type: 'prefixHeader' },
            { label: 'auxiliaryVerb', type: 'header' },
          ],
          [
            { queryForms: { requireFeature: [ 'pastParticiple'] }, type: 'prefix',  formSuffix: ' ' },
            { lexemeClaim: 'auxiliaryVerb' },
          ],
         ],
      }
    }
  },
  germanVerbAdditional: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'verb',
    layout: {
      header: [
        { },
        { label: 'linguisticForm', colspan: 2 },
      ],
      groups: {
        infinitive: [
          [
            { label: 'infinitive', type: 'header' },
            { queryForms: { requireFeature: [ 'infinitive' ] }, colspan: 2 },
          ],
          [
            { label: 'zuInfinitive', type: 'header' },
            { queryForms: { requireFeature: [ 'zuInfinitive' ] }, colspan: 2 },
          ],
          [
            { labels: ['presentParticiple'], type: 'header' },
            { queryForms: { requireFeature: ['presentParticiple'] }, colspan: 2 },
          ]
        ],
        presentIndicative: [
          [
            { labels: ['indicative', 'presentTense'], type: 'header', colspan: 3 },
          ], 
          [
            { labels: ['firstPerson', 'plural'], type: 'header' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'wir ', colspan: 2 },
          ],
          [
            { labels: ['secondPerson', 'plural'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'ihr ', colspan: 2 },
          ],
          [
            { labels: ['thirdPerson', 'plural'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'sie ', colspan: 2 },
          ]
        ],
        preteriteIndicative: [
          [
            { labels: ['indicative', 'preterite'], type: 'header', vAlign: 'bottom' },
            { label: ['singular'], type: 'header', vAlign: 'bottom' },
            { label: ['plural'], type: 'header', vAlign: 'bottom' },
          ], 
          [
            { labels: ['firstPerson'], type: 'header' },
            {},
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'wir ', colspan: 2 },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'du ' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'ihr ' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'er/sie/es ' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'sie ' },
          ]
        ],
        presentIndicativeSubjunctiveI: [
          [
            { labels: ['subjunctiveI', 'presentTense'], type: 'header', vAlign: 'bottom' },
            { label: ['singular'], type: 'header', vAlign: 'bottom' },
            { label: ['plural'], type: 'header', vAlign: 'bottom' },
          ],
          [
            { labels: ['firstPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'ich ' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'wir ' },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'du ' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'ihr ' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'er/sie/es ' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'sie ' },
          ], 
        ],
        presentIndicativeSubjunctiveII: [
          [
            { labels: ['subjunctiveII', 'preterite'], type: 'header', vAlign: 'bottom' },
            { label: ['singular'], type: 'header', vAlign: 'bottom' },
            { label: ['plural'], type: 'header', vAlign: 'bottom' },
          ],
          [
            { labels: ['firstPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'ich ' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'wir ' },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'du ' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'ihr ' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'er/sie/es ' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'sie ' },
          ], 
        ],
      }
    }
  },
  germanAdjectives: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'adjective',
    layout: {
      header: [
        { label: 'positive' },
        { label: 'comparative' },
        { label: 'superlative' },
      ],
      groups: {
        deklination: [
          [
            { queryForms: { requireFeature: [ 'predicative', 'positive'] } },
            { queryForms: { requireFeature: [ 'predicative', 'comparative'] } },
            { queryForms: { requireFeature: [ 'predicative', 'superlative'] }, formPrefix: 'am ' },
          ],
        ],
      },
    }
  },
}

function Forms({ forms, manager, language, lexicalCategory, claims }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/forms.css'));
  }, []);
  
  // Track which forms have been used in tables
  const usedFormIds = new Set();
  
  // Helper function to query forms based on grammatical features
  const queryForms = (query) => {
    if (!forms || !Array.isArray(forms)) {
      return [];
    }
    
    if (query.requireFeature) {
      const featureQIds = query.requireFeature.map(feature => {
        const qid = manager.wikibase.items[feature];
        return qid;
      }).filter(Boolean);
    
      
      if (featureQIds.length === 0) {
        return [];
      }
      
      // Filter forms that match all required Q-IDs
      let matchingForms = forms.filter(form => {
        const matches = featureQIds.every(qid => 
          form.grammaticalFeatures && 
          form.grammaticalFeatures.includes(qid)
        );

        return matches;
      });

      if (query.excludeFeature) {
        const excludeFeatureQIds = query.excludeFeature.map(feature => {
          const qid = manager.wikibase.items[feature];
          return qid;
        }).filter(Boolean);

        matchingForms = matchingForms.filter(form => 
          !excludeFeatureQIds.some(qid => 
            form.grammaticalFeatures && 
            form.grammaticalFeatures.includes(qid)
          )
        );
      }

      // add matching forms to usedFormIds
      matchingForms.forEach(form => {
        usedFormIds.add(form.id);
      });
      
      if (matchingForms.length > 0) {
        return matchingForms.map((item) => html`<${Word} id=${item.id} manager=${manager} showAppendix='no' />`)
      }
    }
      
    return [];
  };

  const getLexemeClaim = (property) => {
    const prop = manager.wikibase?.props?.[property];
    if (!prop) {
      return false
    }


    if (!claims?.[prop]) {
      return false;
    }

    const firstItem = claims[prop]?.[0]?.mainsnak?.datavalue?.value?.id;
    if (!firstItem) {
      return false
    }

    return [ html`<${Word} id=${firstItem} manager=${manager} showAppendix='no' />` ];
  };
  
  // Function to render a table cell based on cell configuration
  const renderTableCell = (cell) => {
    let content = '';
    const classes = ['form__cell'];
    if (cell.queryForms) {
      const forms = queryForms(cell.queryForms);
      if (forms.length > 0) {
        content = forms.map((item, index, array) => 
          index === array.length - 1 
            ? html`${cell.formPrefix ?? ''}${item}${cell.formSuffix ?? ''}`
            : html`${cell.formPrefix ?? ''}${item}${cell.formSuffix ?? ''}<br/>`
        );
      } else {
        content = '–';
      }
    } else if (cell.lexemeClaim) {
      const value = getLexemeClaim(cell.lexemeClaim);
      if (value) {
        content = value.map((item, index, array) => 
          index === array.length - 1 
            ? html`${cell.formPrefix ?? ''}${item}${cell.formSuffix ?? ''}`
            : html`${cell.formPrefix ?? ''}${item}${cell.formSuffix ?? ''}<br/>`
        );
      } else {
        content = '–';
      }
    } else if (cell.label) {
      content = html`<${Thing} id=${manager.wikibase.id}:${manager.wikibase.items[cell.label]} manager=${manager} showAppendix='no' />`;
    } else if (cell.labels) {
      content = cell.labels.map(label => html`<${Thing} id=${manager.wikibase.id}:${manager.wikibase.items[label]} manager=${manager} showAppendix='no' />`).map((label, index, array) => 
        index === array.length - 1 
          ? html`${label}`
          : html`${label}<br />`
      );
    } else if (cell.text) {
      content = cell.text;
    }
    const cellType = ['header', 'prefixHeader'].includes(cell.type) ? 'th' : 'td';
    if (cell.vAlign === 'bottom') {
      classes.push('form__cell--bottom')
    }
    if (cell.type === 'prefix') {
      classes.push('form__cell--prefix')
    } else if (cell.type === 'prefixHeader') {
      classes.push('form__cell--prefix-header') 
    }
    return html`<${cellType} class=${classes.join(' ')} rowspan="${cell.rowspan}"  colspan="${cell.colspan}">${content}</${cellType}>`;
  };

  const tables = []
  
  // Check if we have a matching layout
  for (const [layoutKey, layoutConfig] of Object.entries(formTableLayouts)) {
    const reqLanguage = layoutConfig.requiredLanguage;
    const reqLexicalCategory = layoutConfig.requiredLexicalCategory;

    const hasRequiredClaims = layoutConfig.requiredClaims ? layoutConfig.requiredClaims.every(claim => {
      const prop = manager.wikibase.props?.[claim.property];
      const value = manager.wikibase.items?.[claim.item];
      if (!prop || !value) {
        return false;
      }
      if (!claims?.[prop]) {
        return false;
      }
      return claims[prop].some(c => c?.mainsnak?.datavalue?.value?.id.endsWith(value));
    }) : true;
    
    if (language.endsWith(manager.wikibase.items[reqLanguage]) && 
        lexicalCategory.endsWith(manager.wikibase.items[reqLexicalCategory]) && hasRequiredClaims) {
      
      const layout = layoutConfig.layout;
      
      // Render table with the matching layout
      tables.push(html`
          <table class="forms__table">
            <thead>
              <tr>
                ${layout.header.map(cell => renderTableCell({ type: 'header', ...cell }))}
              </tr>
            </thead>
            ${Object.entries(layout.groups).map(([groupKey, rows]) => {
              return html`<tbody>${rows.map(row => {
                return html`
                  <tr>
                    ${row.map(cell => renderTableCell(cell))}
                  </tr>
                `;
              })}</tbody>`;
            })}
          </table>
      `);
    }
  }
  
  // Get unused forms and render them in a definition list
  const unusedForms = forms?.filter(form => !usedFormIds.has(form.id)) || [];

  
  return html`
    <div class="forms">
      <h2>${browser.i18n.getMessage('forms')}</h2>
      ${tables}
      ${unusedForms.length > 0 ? html`
        ${tables.length > 0 ? html`<h3>${browser.i18n.getMessage('additional_forms')}</h3>` : null }
        <dl class="forms__additional">
          ${unusedForms.map(form => {
            return html`
              <dt>
                ${form.grammaticalFeatures?.map(featureId => 
                  html`<${Thing} id=${`${manager.wikibase.id}:${featureId}`} manager=${manager} />`
                ).map((item, index, array) => 
                  index === array.length - 1 
                    ? html`${item}`
                    : html`${item} / `
                )}
              </dt>
              <dd>
                <${Word} id=${form.id} manager=${manager} showAppendix='no' />
              </dd>
            `;
          })}
        </dl>
      ` : ''}
    </div>
  `;
  
}

export default Forms; 