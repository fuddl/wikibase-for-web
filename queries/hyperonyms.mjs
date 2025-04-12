import { inferredSenses } from './inferredSenses.mjs';

export const hyperonyms = {
  id: 'hyperonyms',
  requiredProps: ['itemForThisSense', 'iso6391Code'],
  query: ({ instance, params }) => {
    // Build hyperonym properties list dynamically
    const hyperonymProps = ['subclassOf', 'parentTaxon', 'instanceOf', 'hyperonym']
      .filter(prop => instance.props[prop])
      .map(prop => `wdt:${instance.props[prop]}`);
    
    return `
    SELECT DISTINCT ?sense ?language ?hyperonym ${instance.props?.semanticGender ? '?semanticGender' : ''} ${instance.props?.languageStyle ? '?languageStyle' : ''} ${instance.props?.fieldOfUse ? '?fieldOfUse' : ''} WHERE {
      ?lexeme rdf:type ontolex:LexicalEntry;
        ontolex:sense ?sense;
        dct:language ?language.

      # Find hyperonyms (broader terms) for the specified senses
      ${params.values.map(value => `
        { 
          ${hyperonymProps.map(prop => `{ wd:${value} ${prop} ?parentConcept. }`).join(' UNION ')  } 
        }`).join(' UNION ')}
      
      ?sense  wdt:${instance.props[params.property]} ?parentConcept.

      ${
        instance.props?.semanticGender
          ? `
        OPTIONAL {
          # Get the semantic gender of the sense
          ?sense wdt:${instance.props.semanticGender} ?semanticGender .
        }`
          : ''
      }

      ${
        instance.props?.languageStyle
          ? `
        OPTIONAL {
          # Get the language style of the sense
          ?sense wdt:${instance.props.languageStyle} ?languageStyle .
        }`
          : ''
      }

      ${
        instance.props?.fieldOfUse
          ? `
        OPTIONAL {
          # Get the field of use of the sense
          ?sense wdt:${instance.props.fieldOfUse} ?fieldOfUse .
        }`
          : ''
      }

      # Filter by language if specified
      ${
        params.excludeLanguage
          ? `
        FILTER(?language != wd:${params.excludeLanguage})
      `
          : ''
      }
      ${params.onlyLanguage ? `FILTER(?language = wd:${params.onlyLanguage})` : ''}
    }
  `;
  },
  cacheTag: ({ instance, params }) =>
    `hyperonyms-${params.values}-${params.excludeLanguage || 'no-exclude'}-${params.onlyLanguage || 'no-only'}`,
  postProcess: inferredSenses.postProcess,
}; 