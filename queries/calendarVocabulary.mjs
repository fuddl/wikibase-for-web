export const calendarVocabulary = {
  id: 'calendar-vocab',
  requiredProps: [
    'instanceOf',
    'calendarMonth',
    'seriesOrdinal',
    'iso6391Code',
    'itemForThisSense',
  ],
  requiredItems: [
    'calendarMonth',
    'gregorianCalendar',
    'dayOfAMonth',
    'plural',
  ],
  query: ({ instance, params }) => `
    SELECT DISTINCT ?ordinal ?type ?string ?lang  WHERE {
      FILTER (?lang in ('${params?.languages ? params.languages.join("', '") : instance.languages.join("', '")}'))
      {
        ?thing wdt:${instance.props.instanceOf} wd:${instance.items.calendarMonth}.
        ?thing wdt:${instance.props.partOf} wd:${instance.items.gregorianCalendar}.
        BIND ('month' as ?type)
      } UNION {
        ?thing wdt:${instance.props.instanceOf} wd:${instance.items.dayOfAMonth}.
        BIND ('day' as ?type)
      }

      FILTER NOT EXISTS { ?form wikibase:grammaticalFeature wd:${instance.items.plural} }
      
      ?thing wdt:${instance.props.seriesOrdinal} ?ordinal.
      
      ?sense wdt:${instance.props.itemForThisSense} ?thing.
      ?lexeme ontolex:sense ?sense.
      ?lexeme ontolex:lexicalForm ?form.
      ?lexeme dct:language ?language.
      ?language wdt:${instance.props.iso6391Code} ?lang.
      
      ?form ontolex:representation ?string.
    }
  `,
  cacheTag: ({ instance, params }) =>
    `calendar-vocab-${params?.languages.join('/') || 'instance'}`,
  postProcess: ({ results }) => {
    const processed = [];
    results.bindings.forEach(bind => {
      processed.push({
        ordinal: parseInt(bind.ordinal.value, 10),
        type: bind.type.value,
        string: bind.string.value,
        lang: bind.lang.value,
      });
    });
    return processed;
  },
};
