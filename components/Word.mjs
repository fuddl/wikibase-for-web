import { h, Component } from '../importmap/preact/src/index.js';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import Thin from './Thin.mjs';
import Lament from './Lament.mjs';

const html = htm.bind(h);

class Word extends Component {
  render({ id, manager, showLemma = 'no', showAppendix = 'yes', processText = null }) {
    const displayId = showLemma === 'yes' ? id.replace(/-[FS]\d+$/, '') : id;
    const [designator, setDesignator] = useState(
      manager?.designators?.[displayId],
    );
    const elementRef = useRef(null);

    const href = manager.urlFromId(id);

    useEffect(() => {
      const setUpObserver = () => {
        const observer = new IntersectionObserver(async entries => {
          if (entries[0].isIntersecting) {
            const newDesignators = await manager.fetchDesignators(displayId);
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

    if (['yes', 'only'].includes(showAppendix)) {
      if (designator?.language) {
        appendix.push(designator.language);
      }
      if (designator?.lexicalCategory) {
        appendix.push(designator.lexicalCategory);
      }
      if (designator?.grammaticalFeatures?.length > 0) {
        appendix = [...appendix, ...designator.grammaticalFeatures];
      }
    }

    const append = appendix.map(
      (item, index) =>
        html`<${Thin} id=${item} manager=${manager} />${index <
          appendix.length - 1
            ? ', '
            : ''}`,
    );

    if (showAppendix == 'only') {
      return append;
    }

    const languageFromLemmas = (lemmas) => {
      const unique = new Set(Object.keys(lemmas).map(i => i.split('-')[0]))
      if (unique.size === 1) {
        return Array.from(unique)[0]
      }
      return 'mul'
    }

    //console.debug(lemmas)
    const processedLemmas = processText && lemmas ? Object.keys(lemmas).reduce((acc, lang) => {
      acc[lang] = { language: lang, value: processText(lemmas[lang].value) };
      return acc;
    }, {}) : lemmas;
    //console.debug(processedLemmas)

    return html`<a class="word" href="${href}" ref=${elementRef}
        >${lemmas ? html`<${Lament} lemmas=${processedLemmas} lang=${languageFromLemmas(lemmas)} />` : null}</a
      >${append.length > 0 ? htm`${' '}(${append})` : ''}`;
  }
}

export default Word;
