export const propertyIcons = {
  id: 'property-icons',
  requiredProps: ['icon', 'formatterURL'],
  query: ({ instance }) => {
    return `
      SELECT ?icon ?prop ?statedInLabel WHERE {
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${instance.languages.join(', ')}". }
        ?prop t:${instance.props.icon} ?icon.
        ?prop rdf:type wikibase:Property.
        ?prop t:${instance.props.formatterURL} ?formatterUrl.
        ${'' /*FILTER(STRENDS(?formatterUrl, "$1")). */}
        FILTER(STRENDS(STR(?icon), ".svg")).
        ${'statedIn' in instance.props ? `
          OPTIONAL {
            ?prop t:${instance.props.statedIn} ?statedIn.
          }
        ` : ''}
      }
  `;
  },
  cacheTag: ({ instance, params }) => 'propertyIcons',
  postProcess: ({ results }, params, instance) => {
    const processed = {};

    results.bindings.forEach(result => {
      const key = `${instance.id}:${result.prop.value.replace(/.+\/(P\d+)$/, '$1')}`;
      if (!(key in processed)) {
        processed[key] = [];
      }
      console.debug(result)
      processed[key].push({
        icon: result.icon.value,
        title: result?.statedInLabel?.value ?? '',
      });
    });

    return processed;
  },
};
