export default {
  spanishNounMale: {
    requiredLanguage: 'spanish',
    requiredLexicalCategory: 'noun',
    requiredClaims: [{ property: 'grammaticalGender', item: 'masculine' }], 
    caption: 'Male noun',
    layout: {
      header: [
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            { queryForms: { requireFeature: [ 'singular'] }, formPrefix: 'el ' },
            { queryForms: { requireFeature: [ 'plural' ] }, formPrefix: 'los ' },
          ],
        ]
      }
    }
  }
}