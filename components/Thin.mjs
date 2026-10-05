import { objectGetFirst } from '../modules/objectGetFirst.mjs';
import { h, Component } from '../importmap/preact/src/index.js';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class InnerThin extends Component {
  render({ id, manager, unit = false }) {
    const query = unit ? 'unitSymbol' : 'shortTitle';

    // Initialise from whatever the manager already knows (in-memory cache,
    // which is pre-seeded from localStorage at startup).
    // Because the parent wrapper sets key={id}, this component is completely
    // re-mounted when the id changes, meaning this initialiser will run again
    // for the new id, so we don't need a manual state reset inside a useEffect.
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const [short, setShort] = useState({});
    const elementRef = useRef(null);

    const href = manager.urlFromId(id);

    useEffect(() => {
      // If we already have a designator (from cache), skip the observer for
      // the label/description fetch.  The short-title SPARQL query is always
      // fetched on intersection because it is not cached.
      if (designator) return;

      const observer = new IntersectionObserver(async entries => {
        if (entries[0].isIntersecting) {
          const newDesignators = await manager.fetchDesignators(id);
          setDesignator(newDesignators);
          observer.disconnect();
        }
      });

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, [id, manager]);

    // The short-title / unit symbol is fetched lazily via a second observer,
    // independently of whether the designator was cached.
    useEffect(() => {
      const observer = new IntersectionObserver(async entries => {
        if (entries[0].isIntersecting) {
          const [wikibase, localId] = id.split(':');
          const newShort = await manager.query(wikibase, query, {
            subject: localId,
          });
          setShort(getByUserLanguage(newShort));
          observer.disconnect();
        }
      });

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, [id, unit, manager, query]);

    let label = designator ? getByUserLanguage(designator.labels) : '';
    let description = designator
      ? getByUserLanguage(designator.descriptions)
      : '';

    return html`<a
      class="thin"
      href="${href}"
      aria-label="${label.value}"
      lang="${short?.language ?? label?.language ?? id}"
      title="${label?.value ? `${label.value} – ` : ''}${description?.value ??
      ''}"
      ref=${elementRef}
      >${short?.value ?? label?.value ?? id}</a
    >`;
  }
}

const Thin = (props) => h(InnerThin, { key: props.id, ...props });
export default Thin;
