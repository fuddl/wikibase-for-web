import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';

const html = htm.bind(h);

const formTableLayouts = {
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
  germanVerbIndicative: {
    requiredLanguage: 'german',
    requiredLexicalCategory: 'verb',
    caption: 'Indicative',
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
  }
}

function Forms({ forms, manager, language, lexicalCategory, claims }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/forms.css'));
  }, []);
  
  // Helper function to query forms based on grammatical features
  const queryForms = (query) => {
    if (!forms || !Array.isArray(forms)) {
      return [];
    }
    
    // Convert feature names to Q-IDs using manager.wikibase.items
    if (query.requireFeature) {
      const featureQIds = query.requireFeature.map(feature => {
        const qid = manager.wikibase.items[feature];
        return qid;
      }).filter(Boolean);
    
      
      if (featureQIds.length === 0) {
        return [];
      }
      
      // Filter forms that match all required Q-IDs
      const matchingForms = forms.filter(form => {
        const matches = featureQIds.every(qid => 
          form.grammaticalFeatures && 
          form.grammaticalFeatures.includes(qid)
        );
        if (matches) {
        }
        return matches;
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
    } else if (cell.text) {
      content = cell.text;
    }
    const cellType = ['header', 'prefixHeader'].includes(cell.type) ? 'th' : 'td';
    if (cell.type === 'prefix') {
      classes.push('form__cell--prefix')
    } else if (cell.type === 'prefixHeader') {
      classes.push('form__cell--prefix-header') 
    }
    return html`<${cellType} class=${classes.join(' ')} rowspan="${cell.rowspan}">${content}</${cellType}>`;
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

  // Default fallback if no matching layout found
  if (tables.length < 1) {
    return null;
  }
  return html`
    <div class="forms">
      <h2>Forms</h2>
      ${tables}    
    </div>
  `;
  
}

export default Forms; 