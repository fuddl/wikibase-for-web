import { h, Component } from '../importmap/preact/src/index.js';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Distinguish extends Component {
  handleChange = e => {
    const { onValueChange } = this.props;
    if (onValueChange) {
      onValueChange({
        name: e.target.name !== '' ? e.target.name : e.target.dataset.proxyName,
        value: e.target.value,
      });
    }
  };
  render({
    name,
    lang,
    entity,
    value: propValue,
    onValueChange,
    required,
    manager,
  }) {
    const [value, setValue] = useState(propValue);

    useEffect(() => {
      requireStylesheet(browser.runtime.getURL('/components/distinguish.css'));
      if (entity && value == '' && manager.wikibase.autodesc) {
        try {
          (async () => {
            const request = await fetch(
              `${manager.wikibase.autodesc}/?q=${entity}&lang=${lang}&mode=short&links=text&redlinks=&format=json`,
            );
            const autoDescription = await request.json();
            if (autoDescription && !autoDescription.result.match(/<i>/)) {
              setValue(autoDescription.result);
            }
          })();
        } catch (error) {
          console.error('Error fetching auto description:', error);
        }
      }
    }, []);

    return html`<textarea
      class="distinguish"
      required=${required}
      lang=${lang}
      name=${name}
      onInput=${this.handleChange}>
        ${value}
      </textarea
    >`;
  }
}

export default Distinguish;
