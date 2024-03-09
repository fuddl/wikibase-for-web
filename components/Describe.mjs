import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect, useRef } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class Describe extends Component {
  render({ id, manager, source = 'descriptions' }) {
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const elementRef = useRef(null);

    const href = manager.urlFromId(id);

    let text = id;

    if (!designator) {
      useEffect(() => {
        const observer = new IntersectionObserver(async entries => {
          if (entries[0].isIntersecting) {
            const newDesignators = await manager.fetchDesignators(id);
            setDesignator(newDesignators);
          }
        });

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      }, []);
    } else {
      text = getByUserLanguage(designator[source]);
    }

    return html`<span ref=${elementRef}>${text.value}</span>`;
  }
}

export default Describe;
