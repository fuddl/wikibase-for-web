const endsWithAMora = ({ representations }) => {
  const aMora = /[かさたなはまやらわがざだばぱ]$/;
  return Object.values(representations).some(entry => aMora.test(entry.value))
}

const endsWithShi = ({ representations }) => {
  return Object.values(representations).some(entry => entry.value.endsWith('し'))
}

export default {
  japaneseIchidanVerb: {
    requiredLanguage: 'japanese',
    requiredLexicalCategory: 'verb',
    requiredClaims: [{
      property: 'conjugationClass',
      some: [
        'aColumnLowerOneRow',
        'aColumnUpperOneRow',
        'baColumnLowerOneRow',
        'baColumnUpperOneRow',
        'daColumnLowerOneRow',
        'gaColumnLowerOneRow',
        'gaColumnUpperOneRow',
        'haColumnLowerOneRow',
        'haColumnUpperOneRow',
        'kaColumnLowerOneRow',
        'kaColumnUpperOneRow',
        'maColumnLowerOneRow',
        'maColumnUpperOneRow',
        'naColumnLowerOneRow',
        'naColumnUpperOneRow',
        'raColumnLowerOneRow',
        'raColumnUpperOneRow',
        'saColumnLowerOneRow',
        'taColumnLowerOneRow',
        'taColumnUpperOneRow',
        'zaColumnLowerOneRow',
        'zaColumnUpperOneRow',
      ]
    }],
    layout: {
      header: [
        { },
        { label: 'affirmative' },
        { label: 'negation' },
      ],
      groups: {
        conjugation: [
          [
            { label: 'nonpastTense', type: 'header' },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] } },
            { queryForms: { requireFeature: [ 'negativeForm'] }, formSuffix: 'ない' },
          ],
          [
            { labels: ['nonpastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ます' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ません' },
          ],
          [
            { labels: ['pastTense'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'た' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'なかった' },
          ],
          [
            { labels: ['pastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ました' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ませんでした' },
          ],
          [
            { labels: ['teForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'て' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'なくて' },
          ],
          [
            { labels: ['potential'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'られる' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'られない' },
          ],
          [
            { labels: ['passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'られる' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'られない' },
          ],
          [
            { labels: ['causativeForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'させる' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'させない' },
          ],
          [
            { labels: ['causativeForm', 'passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'させられる' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'させられない' },
          ],
          [
            { labels: ['imperativeJa'], type: 'header' },
            { queryForms: { requireFeature: [ 'imperativeJa'] } },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] }, formSuffix: 'な' },
          ],
        ],
      },
    }
  },

  // example: https://www.wikidata.org/wiki/Lexeme:L861
  japaneseGodanWaVerb: {
    requiredLanguage: 'japanese',
    requiredLexicalCategory: 'verb',
    requiredClaims: [{
      property: 'conjugationClass',
      item: 'waColumnFiveRow',
    }],
    layout: {
      header: [
        { },
        { label: 'affirmative' },
        { label: 'negation' },
      ],
      groups: {
        conjugation: [
          [
            { label: 'nonpastTense', type: 'header' },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] } },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'ない' },
          ],
          [
            { labels: ['nonpastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ます' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ません' },
          ],
          [
            { labels: ['pastTense'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'った' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わなかった' }, // sic
          ],
          [
            { labels: ['pastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ました' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ませんでした' },
          ],
          [
            { labels: ['teForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'って' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わなくて' },  // sic
          ],
          [
            { labels: ['potential'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'える' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'えない' },  // sic
          ],
          [
            { labels: ['passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'われる' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'われない' },  // sic
          ],
          [
            { labels: ['causativeForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わせる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わせない' }, // sic
          ],
          [
            { labels: ['causativeForm', 'passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わせられる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'わせられない' }, // sic
          ],
          [
            { labels: ['imperativeJa'], type: 'header' },
            { queryForms: { requireFeature: [ 'imperativeJa'] } },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] }, formSuffix: 'な' },
          ],
        ],
      }
    }
  },

  // example: https://www.wikidata.org/wiki/Lexeme:L572
  japaneseGodanMaVerb: {
    requiredLanguage: 'japanese',
    requiredLexicalCategory: 'verb',
    requiredClaims: [{
      property: 'conjugationClass',
      item: 'maColumnFiveRow',
    }],
    layout: {
      header: [
        { },
        { label: 'affirmative' },
        { label: 'negation' },
      ],
      groups: {
        conjugation: [
          [
            { label: 'nonpastTense', type: 'header' },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] } },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'ない' },
          ],
          [
            { labels: ['nonpastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ます' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ません' },
          ],
          [
            { labels: ['pastTense'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'んだ' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'まなかった' }, // sic
          ],
          [
            { labels: ['pastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ました' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ませんでした' },
          ],
          [
            { labels: ['teForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'んで' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'まなくて' },  // sic
          ],
          [
            { labels: ['potential'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'める' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'めない' },  // sic
          ],
          [
            { labels: ['passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'まれる' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'まれない' },  // sic
          ],
          [
            { labels: ['causativeForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'ませる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'ませない' }, // sic
          ],
          [
            { labels: ['causativeForm', 'passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'ませられる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'ませられない' }, // sic
          ],
          [
            { labels: ['imperativeJa'], type: 'header' },
            { queryForms: { requireFeature: [ 'imperativeJa'] } },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] }, formSuffix: 'な' },
          ],
        ],
      }
    }
  },

  // example: https://www.wikidata.org/wiki/Lexeme:L8993
  japaneseGodanRaVerb: {
    requiredLanguage: 'japanese',
    requiredLexicalCategory: 'verb',
    requiredClaims: [{
      property: 'conjugationClass',
      item: 'raColumnFiveRow',
    }],
    layout: {
      header: [
        { },
        { label: 'affirmative' },
        { label: 'negation' },
      ],
      groups: {
        conjugation: [
          [
            { label: 'nonpastTense', type: 'header' },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] } },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'ない' },
          ],
          [
            { labels: ['nonpastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ます' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ません' },
          ],
          [
            { labels: ['pastTense'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'った' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らなかった' }, // sic
          ],
          [
            { labels: ['pastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ました' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ませんでした' },
          ],
          [
            { labels: ['teForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'って' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らなくて' },  // sic
          ],
          [
            { labels: ['potential'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'れる' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'れない' },  // sic
          ],
          [
            { labels: ['passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'られる' },  // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'られない' },  // sic
          ],
          [
            { labels: ['causativeForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らせる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らせない' }, // sic
          ],
          [
            { labels: ['causativeForm', 'passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らせられる' }, // sic
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'らせられない' }, // sic
          ],
          [
            { labels: ['imperativeJa'], type: 'header' },
            { queryForms: { requireFeature: [ 'imperativeJa'] } },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] }, formSuffix: 'な' },
          ],
        ],
      }
    }
  },
  japaneseSuruVerb: {
    requiredLanguage: 'japanese',
    requiredLexicalCategory: 'verb',
    requiredClaims: [{
      property: 'conjugationClass',
      item: 'sIrregularConjugation',
    }],
    layout: {
      header: [
        { },
        { label: 'affirmative' },
        { label: 'negation' },
      ],
      groups: {
        conjugation: [
          [
            { label: 'nonpastTense', type: 'header' },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] } },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithShi }, formSuffix: 'ない' },
          ],
          [
            { labels: ['nonpastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ます' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ません' },
          ],
          [
            { labels: ['pastTense'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'た' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'なかった' }, 
          ],
          [
            { labels: ['pastTense', 'honorific'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ました' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'ませんでした' },
          ],
          [
            { labels: ['teForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'て' }, 
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, formSuffix: 'なくて' }, 
          ],
          [
            { labels: ['potential'], type: 'header' },
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'できる' }, 
            { queryForms: { requireFeature: [ 'conjunctiveForm'] }, slice: { start: 0, end: -1 }, formSuffix: 'できない' },
          ],
          [
            { labels: ['passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'れる' }, 
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'れない' },
          ],
          [
            { labels: ['causativeForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'せる' },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'せない' },
          ],
          [
            { labels: ['causativeForm', 'passiveForm'], type: 'header' },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'せられる' },
            { queryForms: { requireFeature: [ 'negativeForm'], filter: endsWithAMora }, formSuffix: 'せられない' },
          ],
          [
            { labels: ['imperativeJa'], type: 'header' },
            { queryForms: { requireFeature: [ 'imperativeJa'] } },
            { queryForms: { requireFeature: [ 'imperfectiveForm'] }, formSuffix: 'な' },
          ],
        ],
      }
    }
  }
}