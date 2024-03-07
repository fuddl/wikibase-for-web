import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import { useState, useEffect, useRef } from '../../libraries/preact-hooks.js';
import htm from '../../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class Thing extends Component {
  render({ id, manager }) {
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const elementRef = useRef(null);

    let label = '';
    let description = '';

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
      label = getByUserLanguage(designator.labels);
      description = getByUserLanguage(designator.descriptions);
    }

    return html`
      <a
        class="thing"
        href="${'href'}"
        lang="${label?.language ?? id}"
        title="${description?.value ?? ''}"
        ref=${elementRef}
        >${label?.value ?? id}</a
      >
    `;
  }
}

export default Thing;
