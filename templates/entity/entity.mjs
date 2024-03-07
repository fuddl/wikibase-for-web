import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../../libraries/preact-hooks.js';
import htm from '../../node_modules/htm/dist/htm.mjs';
const html = htm.bind(h);
import Ensign from '../ensign/ensign.mjs';
import Remark from '../remark/remark.mjs';

class Entity extends Component {
  render({ id, labels, descriptions, title, claims, manager }) {
    const urls = null;
    const externalIds = null;

    const [wikibase, localId] = id.split(':');

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

    const mainClaims = Object.values(claims).filter(claim => {
      return !['external-id', 'url'].includes(claim[0].mainsnak.datatype);
    });

    return html`
      <section>
        ${labels && descriptions
          ? html`
              <${Ensign}
                labels=${labels}
                descriptions=${descriptions}
                title=${title}
                id=${localId} />
            `
          : null}
        ${mainClaims.map(
          claim =>
            html`<${Remark}
              claim=${claim}
              manager=${manager}
              key=${claim[0].mainsnak.property} />`,
        )}
        ${
          /*urls
          ? html`
              <h3>
                ${browser.i18n.getMessage(urls.length === 1 ? 'link' : 'links')}
              </h3>
              <${Register} claims=${urls} />
            `
          : null */ ''
        }
        ${
          /*externalIds
          ? html`
              <h3>
                ${browser.i18n.getMessage(
                  externalIds.length === 1 ? 'external_id' : 'external_ids',
                )}
              </h3>
              <${Chart} claims=${externalIds} />
            `
          : null*/ ''
        }
      </section>
    `;
  }
}

export default Entity;
