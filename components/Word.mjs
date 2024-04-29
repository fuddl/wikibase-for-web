import { h, Component } from '../importmap/preact.mjs';
import { useState, useEffect, useRef } from '../importmap/preact-hooks.mjs';
import htm from '../importmap/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

class Word extends Component {
  render({ id, manager }) {
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const elementRef = useRef(null);

    const href = manager.urlFromId(id);

    useEffect(() => {
      const setUpObserver = () => {
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
      };

      return setUpObserver();
    }, [id, manager]);

    return html`<a class="word" href="${href}" ref=${elementRef}
        >${designator?.lemmas
          ? (designator.lemmas
              ? Object.entries(designator.lemmas).map(
                  ([lang, lemma]) => lemma?.value,
                )
              : ''
            ).join('/')
          : id}</a
      >
      ${' '}
      (${designator?.language &&
      html`<${Thin} id=${designator.language} manager=${manager} />, `}
      ${designator?.lexicalCategory &&
      html`<${Thin} id=${designator.lexicalCategory} manager=${manager} />`})`;
  }
}

export default Word;
