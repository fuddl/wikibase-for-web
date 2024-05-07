import { h, Component } from '../importmap/preact/src/index.js';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
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

    const lemmas =
      designator?.lemmas || designator?.representations || designator?.glosses;

    let appendix = [];
    if (designator?.language) {
      appendix.push(designator.language);
    }
    if (designator?.lexicalCategory) {
      appendix.push(designator.lexicalCategory);
    }
    if (designator?.grammaticalFeatures?.length > 0) {
      appendix = [...appendix, ...designator.grammaticalFeatures];
    }

    return html`<a class="word" href="${href}" ref=${elementRef}
        >${lemmas
          ? (lemmas
              ? Object.entries(lemmas).map(([lang, lemma]) => lemma?.value)
              : ''
            ).join('/')
          : id}</a
      >
      ${appendix.length > 0
        ? htm`${' '}
  (${appendix.map(
    (item, index) => html`
      <${Thin} id=${item} manager=${manager} />${index < appendix.length - 1
        ? ', '
        : ''}
    `,
  )})
`
        : ''}`;
  }
}

export default Word;
