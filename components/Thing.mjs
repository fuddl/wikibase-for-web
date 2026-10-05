import { h, Component } from '../importmap/preact/src/index.js';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class InnerThing extends Component {
  render({ id, manager, onDescriptorAquired }) {
    // Initialise from whatever the manager already knows (in-memory cache,
    // which is pre-seeded from localStorage at startup).
    // Because the parent wrapper sets key={id}, this component is completely
    // re-mounted when the id changes, meaning this initialiser will run again
    // for the new id, so we don't need a manual state reset inside a useEffect.
    const [designator, setDesignator] = useState(manager?.designators?.[id]);
    const elementRef = useRef(null);

    const href = manager.urlFromId(id);

    useEffect(() => {
      // If we already have a designator (from cache), skip the observer —
      // the idle refresher will take care of keeping it up to date.
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

    let label = designator ? getByUserLanguage(designator.labels) : '';
    let description = designator
      ? getByUserLanguage(designator.descriptions)
      : '';

    if ((label || description) && onDescriptorAquired) {
      onDescriptorAquired({ label, description })
    }

    return html`<a
      class="thing"
      href="${href}"
      lang="${label?.language ?? ''}"
      title="${description?.value ?? ''}"
      ref=${elementRef}
      >${label?.value ?? id}</a
    >`;
  }
}

const Thing = (props) => h(InnerThing, { key: props.id, ...props });
export default Thing;
