import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import { filterBadClaims } from '../modules/filterBadValues.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';

import Ensign from './Ensign.mjs';
import Remark from './Remark.mjs';
import Register from './Register.mjs';
import Chart from './Chart.mjs';

const html = htm.bind(h);

class Entity extends Component {
  render({ id, labels, descriptions, title, claims, manager }) {
    const urls = null;
    const externalIds = null;

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
      claims = propOrder.reduce((acc, prop) => {
        if (claims[prop]) {
          acc[prop] = claims[prop];
        }
        return acc;
      }, {});
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
              <h3>
                ${browser.i18n.getMessage(
                  urlClaims.length === 1 ? 'link' : 'links',
                )}
              </h3>
              <${Register} claims=${urlClaims} manager=${manager} />
            `
          : null}
        ${externalIdClaims
          ? html`
              <h3>
                ${browser.i18n.getMessage(
                  externalIdClaims.length === 1
                    ? 'external_id'
                    : 'external_ids',
                )}
              </h3>
              <${Chart} claims=${externalIdClaims} manager=${manager} />
            `
          : null}
      </section>
    `;
  }
}

export default Entity;
