import { h, Component } from '../importmap/preact/src/index.js';
import {
  useRef,
  useState,
  useEffect,
} from '../importmap/preact/hooks/src/index.js';
import { filterBadClaims } from '../modules/filterBadValues.mjs';
import htm from '../importmap/htm/src/index.mjs';
import Edit from './Edit.mjs';
import Hint from './Hint.mjs';
import { HoverProvider } from '../modules/hoverState.mjs';

import Ensign from './Ensign.mjs';
import Remark from './Remark.mjs';
import Register from './Register.mjs';
import Haste from './Haste.mjs';
import Refer from './Refer.mjs';
import Chart from './Chart.mjs';
import Senses from './Senses.mjs';

const html = htm.bind(h);

function getNumberFormatter(locale, level) {
  if (level === 1) {
    if (locale.startsWith('zh') || locale.startsWith('ja')) {
      return new Intl.NumberFormat(locale, { numberingSystem: 'hanidec' });
    }
    return new Intl.NumberFormat(locale);
  }
  return null;
}

function numberToLetter(n) {
  return String.fromCharCode(96 + n);
}

// General formatter per level.
function formatOrdinal(num, level, locale) {
  if (level === 1) {
    return getNumberFormatter(locale, level).format(num);
  } else if (level === 2) {
    return numberToLetter(num);
  }
  // Fallback to default numeric formatting for deeper levels.
  return num.toString();
}

function buildSenseHierarchy(senses, manager) {
  const hyperProp =
    'hyperonym' in manager.wikibase.props
      ? manager.wikibase.props.hyperonym
      : false;

  const senseById = {};
  senses.forEach(sense => {
    senseById[sense.id] = { ...sense, children: [] };
  });

  const topSenses = [];
  senses.forEach(sense => {
    let hyperonymId = false;
    if (hyperProp in sense.claims) {
      hyperonymId = sense.claims[hyperProp]
        .map(claim => claim.mainsnak?.datavalue?.value?.id)
        .find(Boolean);
    }
    if (hyperonymId && senseById[hyperonymId]) {
      senseById[hyperonymId].children.push(senseById[sense.id]);
    } else {
      topSenses.push(senseById[sense.id]);
    }
  });

  return topSenses;
}

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

function enrichMonolingualTextClaims(claims, props) {
  return claims.map(claimGroup => {
    for (const claim of claimGroup) {
      if (claim?.mainsnak?.datatype === 'monolingualtext') {
        if (
          'qualifiers' in claim &&
          'nameInKana' in props &&
          props.nameInKana in claim.qualifiers
        ) {
          const qualifiers = claim.qualifiers[props.nameInKana];
          for (let i = 0; i < qualifiers.length; i++) {
            if (qualifiers[i]?.datavalue?.value) {
              claim.mainsnak.datavalue.value.representations = {
                'ja-hira': { value: qualifiers[i].datavalue.value },
              };

              // Remove the used qualifier from the array
              qualifiers.splice(i, 1);

              // Stop after the first valid value is found and used
              break;
            }
          }
        }
      }
    }
    return claimGroup;
  });
}

class Entity extends Component {
  render({
    claims,
    descriptions,
    id,
    labels,
    language,
    lemmas,
    lexicalCategory,
    manager,
    modified,
    senses,
    title,
  }) {
    const [wikibase, localId] = id.split(':');
    const sectionRef = useRef(null);
    const [fillsViewport, setFillsViewport] = useState(false);
    const [experimental, setExperimental] = useState(false);

    const checkVisibility = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < 0 && rect.bottom > window.innerHeight;

      setFillsViewport(isVisible);
    };

    useEffect(async () => {
      const { enableExperimental } =
        await browser.storage.sync.get('enableExperimental');
      setExperimental(enableExperimental);
    }, []);

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

    const [propIcons, setPropIcons] = useState(
      manager.wikibases[wikibase]?.propIcons ?? null,
    );

    if (!propIcons) {
      useEffect(() => {
        (async () => {
          const newPropIcons = await manager.fetchPropIcons(wikibase);
          setPropIcons(newPropIcons);
        })();
      }, []);
    }

    //console.debug(propIcons);

    let mainClaims = Object.values(claims).filter(claim => {
      return !['external-id', 'url'].includes(claim[0].mainsnak.datatype);
    });

    mainClaims = filterBadClaims(mainClaims);

    mainClaims = enrichMonolingualTextClaims(
      mainClaims,
      manager.wikibases[wikibase].props,
    );

    const urlClaims = Object.values(claims).filter(claim => {
      return claim[0].mainsnak.datatype === 'url';
    });

    const quickLinkClaims = [];

    const externalIdClaims = Object.values(claims).filter(claim => {
      const isExternalId = claim[0].mainsnak.datatype === 'external-id';
      if (
        isExternalId &&
        propIcons &&
        claim[0].mainsnak.property in propIcons
      ) {
        claim[0].icon = propIcons[claim[0].mainsnak.property];
        quickLinkClaims.push(claim);
        return false;
      }

      return isExternalId;
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

    let senseOrdinals = null;
    if (senses) {
      // Get the user's locale for ordinal formatting
      const userLocale = (manager && manager.userLocale) || navigator.language;

      // Recursively assign ordinals to senses and build the map
      function assignOrdinals(sensesArr, level = 1, prefix = '') {
        const ordinalMap = {};
        sensesArr.forEach((sense, idx) => {
          // Compute the current ordinal segment for this sense
          const currentOrdinalSegment = formatOrdinal(idx + 1, level, userLocale);
          // Build the full ordinal string, inheriting parent's ordinal
          const fullOrdinal = prefix
            ? `${prefix}${currentOrdinalSegment}`
            : currentOrdinalSegment;
          
          // Add to the ordinal map
          ordinalMap[sense.id] = fullOrdinal;

          // Recursively assign ordinals to children
          if (sense.children && sense.children.length > 0) {
            Object.assign(ordinalMap, assignOrdinals(sense.children, level + 1, fullOrdinal));
          }
        });
        return ordinalMap;
      }

      // Build sense hierarchy and assign ordinals
      const topSenses = buildSenseHierarchy(senses, manager);
      senseOrdinals = assignOrdinals(topSenses);
    }

    const addClaims = async () => {
      await browser.runtime.sendMessage({
        type: 'request_workbench',
        workbench: {
          edits: [],
          subjectId: id,
        },
      });
    };
    const searchIds = async () => {
      await browser.runtime.sendMessage({
        type: 'request_workbench',
        workbench: {
          title: browser.i18n.getMessage('search_ids'),
          subjectId: id,
          view: 'id_search',
        },
      });
    };

    return html`
      <${HoverProvider}>
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
                  title=${title} />
              `
            : null}
          ${senses
            ? html`
                <${Senses} 
                  senses=${senses} 
                  manager=${manager} 
                  senseOrdinals=${senseOrdinals} 
                  language=${language} 
                  id=${id} 
                />
              `
            : null}
          ${experimental &&
          (('instanceOf' in manager.wikibase.props &&
            manager.wikibase.props.instanceOf in claims) ||
            language) &&
          html`<${Edit} icon=${'🔍︎'} action=${searchIds} />`}
          ${mainClaims.map(
            claim =>
              html`<${Remark}
                claim=${claim}
                references=${references}
                manager=${manager}
                key=${claim[0].mainsnak.property} />`,
          )}
          <${Hint}
            text=${mainClaims.length === 0
              ? browser.i18n.getMessage('no_claims')
              : null}
            icon=${'+'}
            actionTitle=${browser.i18n.getMessage('add_claims')}
            action=${addClaims} />

          ${quickLinkClaims.length > 0
            ? html`
                <h2 key="links">
                  ${browser.i18n.getMessage(
                    quickLinkClaims.length === 1 ? 'quick_link' : 'quick_links',
                  )}
                </h2>
                <${Haste} claims=${quickLinkClaims} manager=${manager} />
              `
            : null}
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
      </${HoverProvider}>
    `;
  }
}

export default Entity;
