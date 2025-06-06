
function contractArticle(string, claims, manager, uncontracted) {
  if (string.match(/^[AEIOUÂÉÊÎÆŒÅ]/i)) {
    return 'l’';
  } else if (string.match(/^H/i)) {
    if (manager.wikibase?.props?.hasCharacteristic) {
      if (manager.wikibase?.items?.aspiratedH) {
        if (claims?.[manager.wikibase.props.hasCharacteristic].some(claim => claim.mainsnak?.datavalue?.value?.id === `${manager.wikibase.id}:${manager.wikibase.items.aspiratedH}`)) {
          return 'l’';
        }
      }
      if (manager.wikibase?.items?.muteH) {
        if (claims?.[manager.wikibase.props.hasCharacteristic].some(claim => claim.mainsnak?.datavalue?.value?.id === `${manager.wikibase.id}:${manager.wikibase.items.muteH}`)) {
          return uncontracted;
        }
      }
    }
    return '';
  }
  return uncontracted;
}

export default {
  frenchNounFemale: {
    requiredLanguage: 'french',
    requiredLexicalCategory: 'noun',
    requiredClaims: [{ property: 'grammaticalGender', item: 'feminine' }], 
    caption: 'Female noun',
    layout: {
      header: [
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        deklination: [
          [
            {
              queryForms: { requireFeature: [ 'singular'] },
              formPrefix: ({ representations, claims }, manager) => {
                return representations?.fr ? contractArticle(representations.fr.value, claims, manager, 'la ') : ''
              }
            },
            { queryForms: { requireFeature: [ 'plural' ] }, formPrefix: 'les ' },
          ],
        ]
      }
    }
  },
  frenchNounMale: {
    requiredLanguage: 'french',
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
            { queryForms: { requireFeature: [ 'singular'] }, formPrefix: ( { representations, claims }, manager) => {
              return representations?.fr ? contractArticle(representations.fr.value, claims, manager, 'le ') : ''
            } },
            { queryForms: { requireFeature: [ 'plural' ] }, formPrefix: 'les ' },
          ],
        ]
      }
    }
  },
  frenchVerb: {
    requiredLanguage: 'french',
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
            { text: 'je ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'firstPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: 'tu ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'secondPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
          [
            { text: ' il/elle/on ', type: 'prefix' },
            { queryForms: { requireFeature: [ 'thirdPerson', 'singular', 'presentTense', 'indicative'] } },
          ],
        ],
         perfect: [
          [
            { label: 'participle', type: 'header' },
            { label: 'masculine', type: 'prefixHeader' },
            { label: 'feminine', type: 'prefixHeader' },
            ,
          ],
          [
            { label: 'singular', type: 'header' },
            { queryForms: { requireFeature: [ 'singular', 'masculine', 'participle' ] } },
            { queryForms: { requireFeature: [ 'singular', 'feminine', 'participle' ] } },
          ],
          [
            { label: 'plural', type: 'header' },
            { queryForms: { requireFeature: [ 'plural', 'masculine', 'participle' ] } },
            { queryForms: { requireFeature: [ 'plural', 'feminine', 'participle' ] } },
          ],
          [
            { label: 'auxiliaryVerb', type: 'header' },
            { lexemeClaim: 'auxiliaryVerb', colspan: 2 },
          ],
         ],
      }
    }
  },
}