export default {
  bretonNoun: {
    requiredLanguage: 'breton',
    requiredLexicalCategory: 'noun',
    layout: {
      header: [
        { },
        { label: 'singular', displayQuery: { requireFeature: ['singular'] } },
        { label: 'singulative', displayQuery: { requireFeature: ['singulative'] } },
        { label: 'collective', displayQuery: { requireFeature: ['collective'] } },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { label: 'noMutation', type: 'header' },
            {
              queryForms: { requireFeature: [ 'singular', 'noMutation'] }, 
              displayQuery: { requireFeature: ['singular'] },
            },
            {
              queryForms: { requireFeature: [ 'singulative', 'noMutation'] }, 
              displayQuery: { requireFeature: ['singulative'] },
            },
            {
              queryForms: { requireFeature: [ 'collective', 'noMutation'] }, 
              displayQuery: { requireFeature: ['collective'] },
            },
            { queryForms: { requireFeature: [ 'plural', 'noMutation' ] } },
          ],
          [
            { label: 'softMutation', type: 'header' },
            {
              queryForms: { requireFeature: [ 'singular', 'softMutation'] },
              displayQuery: { requireFeature: ['singular'] },
            },
            {
              queryForms: { requireFeature: [ 'singulative', 'softMutation'] },
              displayQuery: { requireFeature: ['singulative'] },
            },
            {
              queryForms: { requireFeature: [ 'collective', 'softMutation'] },
              displayQuery: { requireFeature: ['collective'] },
            },
            { queryForms: { requireFeature: [ 'plural', 'softMutation' ] } },
          ],
          [
            {
              label: 'aspirateMutation', type: 'header',
               displayQuery: { requireFeature: ['aspirateMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'singular', 'aspirateMutation'] },
              displayQuery: { requireFeature: ['singular', 'aspirateMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'singulative', 'aspirateMutation'] },
              displayQuery: { requireFeature: ['singulative', 'aspirateMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'collective', 'aspirateMutation'] },
              displayQuery: { requireFeature: ['collective', 'aspirateMutation'] },
            },
            { 
              queryForms: { requireFeature: [ 'plural', 'aspirateMutation' ] },
              displayQuery: { requireFeature: ['collective', 'aspirateMutation'] },
            },
          ],
          [
            {
              label: 'hardMutation', type: 'header',
               displayQuery: { requireFeature: ['hardMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'singular', 'hardMutation'] },
              displayQuery: { requireFeature: ['singular', 'hardMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'singulative', 'hardMutation'] },
              displayQuery: { requireFeature: ['singulative', 'hardMutation'] },
            },
            {
              queryForms: { requireFeature: [ 'collective', 'hardMutation'] },
              displayQuery: { requireFeature: ['collective', 'hardMutation'] },
            },
            { 
              queryForms: { requireFeature: [ 'plural', 'hardMutation' ] },
              displayQuery: { requireFeature: ['collective', 'hardMutation'] },
            },
          ],
        ]
      }
    }
  },
  bretonPreposition: {
    requiredLanguage: 'breton',
    requiredLexicalCategory: 'preposition',
    layout: {
      header: [
        { label: 'grammaticalPerson' },
        { label: 'grammaticalForm', colspan: 2 },
      ],
      groups: {
        singular: [
          [
            { type: 'header' },
            { label: 'singular', type: 'header', colspan: 2 },
          ],
          [
            { label: 'uninflectedWord', type: 'header' },
            { queryForms: { requireFeature: [] }, colspan: 2 }
          ],
          [
            { label: 'firstPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular' ] }, colspan: 2 }
          ],
          [
            { label: 'secondPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular' ] }, colspan: 2 }
          ],
          [
            { type: 'header' },
            { label: 'masculine', type: 'header' },
            { label: 'feminine', type: 'header' },
          ],
          [
            { label: 'thirdPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'masculine' ] } },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'feminine' ] } },
          ],
        ],
        plural: [
          [
            { type: 'header' },
            { label: 'plural', type: 'header', colspan: 2 },
          ],
          [
            { label: 'firstPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'firstPerson', 'plural' ] }, colspan: 2 }
          ],
          [
            { label: 'secondPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'secondPerson', 'plural' ] }, colspan: 2 }
          ],
          [
            { label: 'thirdPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'plural' ] }, colspan: 2 }
          ],
          [
            { label: 'zeroPerson', type: 'header' },
            { queryForms: { requireFeature: [ 'zeroPerson' ] }, colspan: 2 }
          ],
        ]
      }
    }
  },
}