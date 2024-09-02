import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
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
      dataType,
      disabled,
      max,
      min,
      name,
      proxyName,
      required,
      onFocus,
      onBlur,
      size,
      ref,
      step,
      type = 'text',
      value,
      isFocused,
    } = this.props;
    return html`<input
      class="type ${isFocused ? 'type--focus' : ''}"
      type=${type}
      name=${name}
      size=${size}
      step=${step}
      onFocus=${onFocus}
      onBlur=${onBlur}
      min=${min}
      max=${max}
      ref=${ref}
      required=${required}
      data-type=${dataType}
      disabled=${disabled}
      data-proxy-name=${proxyName}
      value=${value}
      onInput=${this.handleChange} />`;
  }
}

export default Type;
