import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import { filterBadClaims } from '../modules/filterBadValues.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

import Ensign from './Ensign.mjs';
import Remark from './Remark.mjs';
import Register from './Register.mjs';
import Chart from './Chart.mjs';

const html = htm.bind(h);

function applyPropOrder(claims, propOrder) {
  // Separate claims into those in propOrder and those not
  let sortedClaims = {};
  let otherClaims = {};

  Object.keys(claims).forEach(key => {
    if (propOrder.includes(key)) {
      sortedClaims[key] = claims[key];
    } else {
      otherClaims[key] = claims[key];
    }
  });

  // Sort the `sortedClaims` according to `propOrder`
  sortedClaims = propOrder.reduce((acc, prop) => {
    if (sortedClaims[prop]) {
      acc[prop] = sortedClaims[prop];
    }
    return acc;
  }, {});

  // Combine sorted claims with those not in propOrder
  const orderedClaims = { ...sortedClaims, ...otherClaims };

  return orderedClaims;
}

class Entity extends Component {
  render({ id, labels, descriptions, title, claims, manager }) {
    const [wikibase, localId] = id.split(':');

    manager.wikibase = manager.wikibases[wikibase];

    const [propOrder, setPropOrder] = useState(
      manager.wikibases[wikibase]?.propOrder ?? null,
    );

    if (!propOrder) {
      useEffect(() => {
        (async () => {
          const newPropOrder = await manager.fetchPropOrder(wikibase);
          setPropOrder(newPropOrder);
        })();
      }, []);
    } else if (propOrder.length > 0) {
      claims = applyPropOrder(claims, propOrder);
    }

    let mainClaims = Object.values(claims).filter(claim => {
      return !['external-id', 'url'].includes(claim[0].mainsnak.datatype);
    });

    mainClaims = filterBadClaims(mainClaims);

    const urlClaims = Object.values(claims).filter(claim => {
      return claim[0].mainsnak.datatype === 'url';
    });

    const externalIdClaims = Object.values(claims).filter(claim => {
      return claim[0].mainsnak.datatype === 'external-id';
    });

    return html`
      <section>
        ${labels && descriptions
          ? html`
              <${Ensign}
                labels=${labels}
                descriptions=${descriptions}
                title=${title}
                id=${id}
                manager=${manager} />
            `
          : null}
        ${mainClaims.map(
          claim =>
            html`<${Remark}
              claim=${claim}
              manager=${manager}
              key=${claim[0].mainsnak.property} />`,
        )}
        ${urlClaims.length > 0
          ? html`
              <h2 key="links">
                ${browser.i18n.getMessage(
                  urlClaims.length === 1 ? 'link' : 'links',
                )}
              </h2>
              <${Register} claims=${urlClaims} manager=${manager} />
            `
          : null}
        ${externalIdClaims.length > 0
          ? html`
              <h2 key="external_ids">
                ${browser.i18n.getMessage(
                  externalIdClaims.length === 1
                    ? 'external_id'
                    : 'external_ids',
                )}
              </h2>
              <${Chart} claims=${externalIdClaims} manager=${manager} />
            `
          : null}
      </section>
    `;
  }
}

export default Entity;
