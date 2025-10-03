export default {
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
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'der ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ', lang: 'de' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'des ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ', lang: 'de' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'dem ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ', lang: 'de' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'den ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'die ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ', lang: 'de' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'der ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ', lang: 'de' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'der ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ', lang: 'de' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'die ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'singular', 'nominativeCase'] }, formPrefix: 'das ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'nominativeCase'] }, formPrefix: 'die ', lang: 'de' },
          ],
          [
            { label: 'genitiveCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'genitiveCase'] }, formPrefix: 'des ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'genitiveCase'] }, formPrefix: 'der ', lang: 'de' },
          ],
          [
            { label: 'dativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'dativeCase'] }, formPrefix: 'dem ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'dativeCase'] }, formPrefix: 'den ', lang: 'de' },
          ],
          [
            { label: 'accusativeCase', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'accusativeCase'] }, formPrefix: 'das ', lang: 'de' },
            { queryForms: { requireFeature: [ 'plural', 'accusativeCase'] }, formPrefix: 'die ', lang: 'de' },
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
            { text: 'ich ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: 'du ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: 'er/sie/es ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
        ],
        preterite: [
          [
            { label: 'preterite', type: 'header' },
            { text: 'ich ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'preterite', 'indicative'] } },
          ],
        ],
        subjunctiveII: [
          [
            { label: 'subjunctiveII', type: 'header' },
            { text: 'ich ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveII'] } },
          ],
        ],
        imperative: [
          [
            { label: 'imperative', type: 'header', rowspan: 2 },
            { text: 'du, ', type: 'prefix', lang: 'de' },
            { queryForms: { requireFeature: [ 'singular', 'imperative'] }, formSuffix: '!' },
          ],
          [
            { text: 'ihr, ', type: 'prefix', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'wir ', colspan: 2, lang: 'de' },
          ],
          [
            { labels: ['secondPerson', 'plural'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'ihr ', colspan: 2, lang: 'de' },
          ],
          [
            { labels: ['thirdPerson', 'plural'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'indicative', 'presentTense' ] }, formPrefix: 'sie ', colspan: 2, lang: 'de' },
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
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'ich ', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'wir ', lang: 'de' },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'du ', lang: 'de' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'ihr ', lang: 'de' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'er/sie/es ', lang: 'de' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'sie ', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'ich ', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'wir ', lang: 'de' },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'du ', lang: 'de' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'ihr ', lang: 'de' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'er/sie/es ', lang: 'de' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'subjunctiveI', 'presentTense' ] }, formPrefix: 'sie ', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'ich ', lang: 'de' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'wir ', lang: 'de' },
          ],
          [
            { labels: ['secondPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'du ', lang: 'de' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'ihr ', lang: 'de' },
          ],
          [
            { labels: ['thirdPerson'], type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'subjunctiveII', 'preterite' ] }, formPrefix: 'er/sie/es ', lang: 'de' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural', 'subjunctiveII', 'preterite' ] }, formPrefix: 'sie ', lang: 'de' },
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
            { queryForms: { requireFeature: [ 'predicative', 'superlative'] }, formPrefix: 'am ', lang: 'de' },
          ]
        ]
      }
    }
  }
}