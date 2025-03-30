import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Gloss from './Gloss.mjs';
import Mark from './Mark.mjs';

const html = htm.bind(h);

function Grasp({ senses, manager, senseOrdinals }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/grasp.css'));
  }, []);

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

  // Recursively render senses using the sense ordinals map
  function renderSenses(sensesArr) {
    const wrap = senses.length > 1 ? 'dd' : 'div';
    return sensesArr.map(sense => {
      return html`
        ${
          senses.length > 1 &&
          html`<dt class="grasp__id" key=${`${sense.id}-id`}>
            <${Mark} ordinal=${senseOrdinals[sense.id]} />
          </dt>`
        }
        <${wrap} class="grasp__gloss" key=${`${sense.id}-gloss`}>
          <${Gloss} sense=${sense} manager=${manager} />
        </${wrap}>
        ${
          sense.children.length > 0
            ? html`
                <dd class="grasp__subsenses">
                  <dl class="grasp">${renderSenses(sense.children)}</dl>
                </dd>
              `
            : null
        }
      `;
    });
  }

  return html` <dl class="grasp">${renderSenses(topSenses)}</dl> `;
}

export default Grasp;
