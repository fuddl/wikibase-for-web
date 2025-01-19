export const propertyIcons = {
  id: 'property-icons',
  requiredProps: ['icon', 'formatterURL'],
  query: ({ instance }) => {
    return `
      SELECT ?icon ?prop WHERE {
        ?prop wdt:${instance.props.icon} ?icon.
        ?prop rdf:type wikibase:Property.
        ?prop wdt:${instance.props.formatterURL} ?formatterUrl.
        ${'' /*FILTER(STRENDS(?formatterUrl, "$1")). */}
        FILTER(STRENDS(STR(?icon), ".svg")).
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
      processed[key].push(result.icon.value);
    });

    return processed;
  },
};
