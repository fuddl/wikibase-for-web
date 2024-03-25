import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Specify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      labels: {},
      value: props.value,
    };
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

  render() {
    const { options, name } = this.props;
    const { labels } = this.state;

    return html`
      <select class="specify" name=${name}>
        ${options.map(
          option =>
            html` <option
              value=${option.replace(/^\w+\:/, '')}
              selected=${option === this.state.value}>
              ${labels[option] ?? option}
            </option>`,
        )}
      </select>
    `;
  }
}

export default Specify;
