export default {
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
  }
}