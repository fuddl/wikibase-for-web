import { h, Component } from '../importmap/preact.mjs';
import htm from '../importmap/htm.mjs';
import Thin from './Thin.mjs';

const html = htm.bind(h);

class Amount extends Component {
  render({ amount, unit, manager }) {
    const number = new Intl.NumberFormat().format(parseFloat(amount));
    return html`<span>
      ${number} ${' '}
      ${unit != 1 &&
      html`<${Thin} id=${unit} unit=${true} manager=${manager} />`}
    </span>`;
  }
}

export default Amount;
