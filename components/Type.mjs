import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Type extends Component {
  handleChange = e => {
    const { onValueChange } = this.props;
    if (onValueChange) {
      onValueChange({
        name: e.target.name !== '' ? e.target.name : e.target.dataset.proxyName,
        value: e.target.value,
      });
    }
  };

  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/type.css'));
  }

  render() {
    const {
      value,
      type = 'text',
      name,
      proxyName,
      min,
      max,
      disabled,
    } = this.props;
    return html`<input
      class="type"
      type=${type}
      name=${name}
      min=${min}
      max=${max}
      disabled=${disabled}
      data-proxy-name=${proxyName}
      value=${value}
      onInput=${this.handleChange} /> `;
  }
}

export default Type;
