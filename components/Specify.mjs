import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class Specify extends Component {
  render({ options, manager }) {
    const { labels, setLabels } = useState([]);
    useEffect(() => {}, []);
    return html`<select>
      ${options.map(
        (option, key) => html`<option>${labels?.[key] ?? option}</option>`,
      )}
    </select>`;
  }
}

export default Specify;
