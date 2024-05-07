import { h, Component } from '../importmap/preact/src/index.js';
import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class AutoDesc extends Component {
  render({ id, api }) {
    const lang = navigator.language.split(',')[0];

    const [description, setDescription] = useState(
      browser.i18n.getMessage('load_autodesc'),
    );
    const elementRef = useRef(null);

    useEffect(() => {
      requireStylesheet(browser.runtime.getURL('/components/autodesc.css'));
      const setUpObserver = () => {
        const observer = new IntersectionObserver(async entries => {
          if (entries[0].isIntersecting) {
            const request = await fetch(
              `${api}/?q=${id}&lang=${lang}&mode=short&links=text&redlinks=&format=json`,
            );
            const autoDesctription = await request.json();
            if (!autoDesctription.result.match(/<i>/)) {
              setDescription(autoDesctription.result);
            } else {
              setDescription('');
            }
          }
        });

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      };

      return setUpObserver();
    }, []);

    return html`<span class="autodesc" ref=${elementRef}>${description}</span>`;
  }
}

export default AutoDesc;
