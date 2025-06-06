import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Thing from './Thing.mjs';
import Word from './Word.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import formTableLayouts from '../forms/index.mjs';

const html = htm.bind(h);



function Forms({ forms, manager, language, lexicalCategory, claims }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/forms.css'));
  }, []);
  
  // Track which forms have been used in tables
  const usedFormIds = new Set();
  
  // Helper function to query forms based on grammatical features
  const queryForms = (query, options = {}) => {
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
        return matchingForms;
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
      const forms = queryForms(cell.queryForms, cell);

      if (forms.length > 0) {
        content = forms.map((item, index, array) => {
          const prefix = typeof cell.formPrefix === 'function' ? cell.formPrefix(item, manager) : cell.formPrefix
          const suffix = typeof cell.formSuffix === 'function' ? cell.formSuffix(item, manager) : cell.formSuffix
          const form = html`<${Word}
            id=${item.id}
            manager=${manager}
            lemmas=${item.representations}
            showAppendix='no'
            processText=${cell.slice ? (text) => {
              return text.slice(cell.slice.start, cell.slice.end) 
            } : null}
          />`
          return index === array.length - 1 
            ? html`${prefix ?? ''}${form}${suffix ?? ''}`
            : html`${prefix ?? ''}${form}${suffix ?? ''}<br/>`
          }
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
      const values = claim.some ? claim.some.map(item => manager.wikibase.items?.[item]) : [manager.wikibase.items?.[claim.item]];
      if (!prop || !values) {
        return false;
      }
      if (!claims?.[prop]) {
        return false;
      }
      return claims[prop].some(c => values.some(value => c?.mainsnak?.datavalue?.value?.id.endsWith(value)));
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
        <div class="forms__extra">
          ${unusedForms.map(form => {
            return html`
              <figure class="forms__extra__form">
                <div class="forms__extra__form__text">
                  <${Word} id=${form.id} lemmas=${form.representations} manager=${manager} showAppendix='no' />
                </div>
                <figcaption class="forms__extra__form__caption">
                  ${form.grammaticalFeatures?.map(featureId => 
                    html`<${Thing} id=${`${manager.wikibase.id}:${featureId}`} manager=${manager} />`
                  ).map((item, index, array) => 
                    index === array.length - 1 
                      ? html`${item}`
                      : html`${item} / `
                  )}
                  <span class="forms__extra__form__caption__id">(${form.id.replace(`${manager.wikibase.id}:`, '')})</span>
                </figcaption>
              </figure>
            `;
          })}
        </div>
      ` : ''}
    </div>
  `;
  
}

export default Forms; 