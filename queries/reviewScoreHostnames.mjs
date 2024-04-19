export const reviewScoreHostnames = {
  id: 'review-score-by',
  requiredProps: ['reviewScoreBy', 'officialWebsite'],
  query: ({ instance, params }) => `
    SELECT DISTINCT ?hostname ?id WHERE {
      ?s pq:${instance.props.reviewScoreBy} ?item. ?item wdt:${instance.props.officialWebsite} ?url.
      ?item wdt:${instance.props.officialWebsite} ?url.
      BIND(REPLACE(STR(?item), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?id).
      BIND(REPLACE(STR(?url), "^[a-z]+://", "") as ?sans_protocol).
      FILTER(!REGEX(?sans_protocol, "/.+$", "i")).
      BIND(REPLACE(?sans_protocol, "/$", '') as ?hostname).
      FILTER(?hostname = "${params.hostname}").
    }
  `,
  cacheTag: ({ instance, params }) =>
    `review:sore${instance.props.reviewScoreBy}:${instance.props.officialWebsite}:${params.hostname}`,
  postProcess: ({ results }) => {
    const processed = [];
    results.bindings.forEach(bind => {
      if (bind?.id?.value) {
        processed.push(bind.id.value);
      }
    });
    return processed;
  },
};
