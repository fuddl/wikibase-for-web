import { h, Component } from '../importmap/preact.mjs';
import { useRef, useState, useEffect } from '../importmap/preact-hooks.mjs';
import { filterBadClaims } from '../modules/filterBadValues.mjs';
import htm from '../importmap/htm.mjs';

import Ensign from './Ensign.mjs';
import Remark from './Remark.mjs';
import Register from './Register.mjs';
import Refer from './Refer.mjs';
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
  render({
    id,
    labels,
    lemmas,
    lexicalCategory,
    language,
    descriptions,
    title,
    claims,
    modified,
    manager,
  }) {
    const [wikibase, localId] = id.split(':');
    const sectionRef = useRef(null);
    const [fillsViewport, setFillsViewport] = useState(false);

    const checkVisibility = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < 0 && rect.bottom > window.innerHeight;

      setFillsViewport(isVisible);
    };

    useEffect(() => {
      // Check initial visibility without waiting for scroll
      checkVisibility();

      // Add scroll event listener
      window.addEventListener('scroll', checkVisibility, { passive: true });

      // Cleanup function to remove the event listener
      return () => {
        window.removeEventListener('scroll', checkVisibility);
      };
    }, []);

    useEffect(() => {
      if (fillsViewport) {
        manager.updateSidebarAction(wikibase);
      }
    }, [fillsViewport]);

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

    let counter = 1;
    const references = {};
    mainClaims
      .map(claimSet => {
        return claimSet.map(claim => {
          if (claim.references) {
            return claim.references.map(reference => {
              if (!Object.keys(references).includes(reference.hash)) {
                references[reference.hash] = {
                  number: counter++,
                  reference: reference,
                };
              }
            });
          }
        });
      })
      .flat();
    const numberOfReferences = Object.keys(references).length;

    return html`
      <section ref=${sectionRef}>
        ${(labels && descriptions) || lemmas
          ? html`
              <${Ensign}
                labels=${labels}
                lemmas=${lemmas}
                id=${id}
                descriptions=${descriptions}
                lexicalCategory=${lexicalCategory}
                language=${language}
                manager=${manager}
                title=${title}
                key=${modified} />
            `
          : null}
        ${mainClaims.map(
          claim =>
            html`<${Remark}
              claim=${claim}
              references=${references}
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
        ${numberOfReferences > 0
          ? html`
              <h2 key="links">
                ${browser.i18n.getMessage(
                  numberOfReferences === 1 ? 'reference' : 'references',
                )}
              </h2>
              <${Refer}
                references=${references}
                manager=${manager}
                wikibase=${wikibase} />
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
