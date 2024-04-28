import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import OptionsHistoryAPI from '../modules/OptionsHistoryAPI.mjs';

const optionsHistoryAPI = new OptionsHistoryAPI();

const html = htm.bind(h);

class Specify extends Component {
  constructor(props) {
    super(props);

    this.options = optionsHistoryAPI.getSortedOptions(props.options);

    this.state = {
      labels: {},
      value: props?.value ?? this.options[0],
    };

    this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/specify.css'));
    const { options, manager } = this.props;
    const labels = {};

    for (const option of options) {
      const propertyDesignator = await manager.fetchDesignators(option);
      const label = getByUserLanguage(propertyDesignator.labels).value;
      labels[option] = label;
    }

    this.setState({ labels });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const { options, name, signature, disabled } = this.props;
    const { labels } = this.state;

    return html`
      <input
        name=${name}
        type="hidden"
        value=${this.state.value.replace(/^\w+\:/, '')} />
      <select
        class="specify"
        disabled=${disabled}
        onChange=${this.handleChange}>
        ${this.options.map(
          option =>
            html` <option
              value=${option}
              selected=${option === this.state.value}
              data-prefixed-value=${option}>
              ${labels[option] ?? option}
            </option>`,
        )}
      </select>
    `;
  }
}

export default Specify;
