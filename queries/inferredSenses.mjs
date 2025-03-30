export const inferredSenses = {
  id: 'inferred-senses',
  requiredProps: ['itemForThisSense', 'predicateFor'],
  query: ({ instance, params }) => `
    SELECT DISTINCT ?sense ?language ${instance.props?.semanticGender ? '?semanticGender' : ''} WHERE {
      ?lexeme rdf:type ontolex:LexicalEntry;
        ontolex:sense ?sense;
        dct:language ?language.

      # Find other senses that share the same value for the specified property
      ${params.values.map(value => `?sense wdt:${instance.props[params.property]} wd:${value} .`).join(' ')}
      
      ${
        instance.props?.semanticGender
          ? `
        OPTIONAL {
          # Get the semantic gender of the sense
          ?sense wdt:${instance.props.semanticGender} ?semanticGender .
        }`
          : ''
      }

      ?language wdt:${instance.props.iso6391Code} ?lang .
      FILTER(?lang in ('${params.languages.join("', '")}'))

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
  `,
  cacheTag: ({ instance, params }) =>
    `inferred-senses-${params.values}-${params.property}-${params.excludeLanguage || 'no-exclude'}-${params.onlyLanguage || 'no-only'}`,
  postProcess: ({ results }, params, instance) => {
    const processed = [];
    results.bindings.forEach(bind => {
      processed.push({
        sense: bind.sense.value.replace(
          /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
          `${instance.id}:$1`,
        ),
        language: bind.language.value.replace(
          /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
          `${instance.id}:$1`,
        ),
        property: params.property,
        semanticGender:
          bind?.semanticGender?.value.replace(
            /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
            `${instance.id}:$1`,
          ) ?? '',
      });
    });
    return processed;
  },
};
