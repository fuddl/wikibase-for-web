import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

class Spinner extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        requireStylesheet(browser.runtime.getURL('/components/spinner.css'));
    }
    render() {
        return html`
        <div class="spinner ${this.props.small ? 'spinner--small' : ''}">
            <div class="spinner__container">
                ${Array.from({ length: 12 }, (_, i) => html`<div class="spinner__tick"></div>`)}
            </div>
        </div>
        `;
    }
}

export default Spinner;