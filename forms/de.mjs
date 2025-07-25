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
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'indicative', 'preterite' ] }, formPrefix: 'ich ' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural', 'indicative', 'preterite' ] }, formPrefix: 'wir ' },
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
          ]
        ]
      }
    }
  }
}