import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
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

    const queriedLabels = await manager.queryManager.query(
      manager.wikibase,
      manager.queryManager.queries.labels,
      {
        items: options.map(i => i.replace(`${manager.wikibase.id}:`, '')),
      },
    );

    for (const option of options) {
      const label =
        queriedLabels?.[option.replace(`${manager.wikibase.id}:`, '')] ??
        option;
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
