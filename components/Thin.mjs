import { objectGetFirst } from '../modules/objectGetFirst.mjs';
import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect, useRef } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class Thin extends Component {
  render({ id, manager, unit = false }) {
    const query = unit ? 'unitSymbol' : 'shortTitle';
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const [short, setShort] = useState({});
    const elementRef = useRef(null);

    let label = '';
    let description = '';
    const href = manager.urlFromId(id);

    if (!designator) {
      useEffect(() => {
        const observer = new IntersectionObserver(async entries => {
          if (entries[0].isIntersecting) {
            const newDesignators = await manager.fetchDesignators(id);
            setDesignator(newDesignators);
            const [wikibase, localId] = id.split(':');
            const newShort = await manager.query(wikibase, query, {
              subject: localId,
            });
            setShort(getByUserLanguage(newShort));
          }
        });

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      }, []);
    } else {
      label = getByUserLanguage(designator.labels);
      description = getByUserLanguage(designator.descriptions);
    }

    return html`
      <a
        class="thing"
        href="${href}"
        lang="${short?.language ?? label?.language ?? id}"
        title="${description?.value ?? ''}"
        ref=${elementRef}
        >${short?.value ?? label?.value ?? id}</a
      >
    `;
  }
}

export default Thin;
