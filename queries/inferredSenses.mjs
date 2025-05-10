export const inferredSenses = {
  id: 'inferred-senses',
  requiredProps: [],
  query: ({ instance, params }) => `
    SELECT DISTINCT ?sense ?language ${instance.props?.semanticGender ? '?semanticGender' : ''} ${instance.props?.languageStyle ? '?languageStyle' : ''} ${instance.props?.fieldOfUse ? '?fieldOfUse' : ''} WHERE {
      ?lexeme rdf:type ontolex:LexicalEntry;
        ontolex:sense ?sense;
        dct:language ?language.

      # Find other senses that share the same value for the specified property
      ${params.values.map((value) => {
        if (params.property === 'pertainymOf' && instance.props?.itemForThisSense) {
          return `{
            wd:${value} wdt:${instance.props.itemForThisSense} ?pertainerItem.
            ?perteinerSense wdt:${instance.props.itemForThisSense} ?pertainerItem.
            ?sense wdt:${instance.props.pertainymOf} ?perteinerSense.
          }`
        }
        return `{ ?sense wdt:${instance.props[params.property]} wd:${value} . }`
      }).join(' UNION ')}
      
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
      {
        ?language wdt:${instance.props.iso6391Code} ?lang .
      } UNION {
        ?language wdt:${instance.props.wikimediaLanguageCode} ?lang .
      }
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
    const senseMap = new Map();

    results.bindings.forEach(bind => {
      const sense = bind.sense.value.replace(
        /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
        `${instance.id}:$1`,
      );
      const language = bind.language.value.replace(
        /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
        `${instance.id}:$1`,
      );
      const semanticGender = bind.semanticGender
        ? bind.semanticGender.value.replace(
            /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
            `${instance.id}:$1`,
          )
        : null;

      const languageStyle = bind.languageStyle
        ? bind.languageStyle.value.replace(
            /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
            `${instance.id}:$1`,
          )
        : null;

      const fieldOfUse = bind.fieldOfUse
        ? bind.fieldOfUse.value.replace(
            /^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
            `${instance.id}:$1`,
          )
        : null;

      if (senseMap.has(sense)) {
        // Merge with existing entry
        const existing = senseMap.get(sense);
        existing.languages = [...new Set([...existing.languages, language])];
        if (semanticGender) {
          existing.semanticGenders = [
            ...new Set([...existing.semanticGenders, semanticGender]),
          ];
        }
        if (languageStyle) {
          existing.languageStyles = [
            ...new Set([...(existing.languageStyles || []), languageStyle]),
          ];
        }
        if (fieldOfUse) {
          existing.fieldOfUses = [
            ...new Set([...(existing.fieldOfUses || []), fieldOfUse]),
          ];
        }
      } else {
        // Create new entry
        senseMap.set(sense, {
          sense,
          language,
          languages: [language],
          property: params.property,
          semanticGenders: semanticGender ? [semanticGender] : [],
          languageStyles: languageStyle ? [languageStyle] : [],
          fieldsOfUse: fieldOfUse ? [fieldOfUse] : [],
        });
      }
    });

    return Array.from(senseMap.values());
  },
};
