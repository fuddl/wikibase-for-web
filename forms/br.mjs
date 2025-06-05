export default {
  bretonNoun: {
    requiredLanguage: 'breton',
    requiredLexicalCategory: 'noun',
    layout: {
      header: [
        { },
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { label: 'noMutation', type: 'header' },
            {
              queryForms: { requireFeature: [ 'singular', 'noMutation'] },
            },
            { queryForms: { requireFeature: [ 'plural', 'noMutation' ] } },
          ],
          [
            { label: 'softMutation', type: 'header' },
            {
              queryForms: { requireFeature: [ 'singular', 'softMutation'] },
            },
            { queryForms: { requireFeature: [ 'plural', 'softMutation' ] } },
          ],
          [
            { label: 'aspirateMutation', type: 'header' },
            {
              queryForms: { requireFeature: [ 'singular', 'aspirateMutation'] },
            },
            { queryForms: { requireFeature: [ 'plural', 'aspirateMutation' ] } },
          ],
        ]
      }
    }
  },
}