import { h, Component } from '../importmap/preact.mjs';
import { useState, useEffect, useRef } from '../importmap/preact-hooks.mjs';
import htm from '../importmap/htm.mjs';
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
