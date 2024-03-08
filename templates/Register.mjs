import { h, Component } from '../node_modules/preact/dist/preact.mjs';
import htm from '../node_modules/htm/dist/htm.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Snack from './Snack.mjs';
import Thing from './Thing.mjs';

const html = htm.bind(h);

class Register extends Component {
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/templates/remark.css'));
  }

  render({ claims, manager }) {
    return html`<ul class="register">
      ${claims &&
      claims.map(
        claim =>
          html`<li class="register__item">
            <strong class="register__label">
              <${Thing} id=${claims[0][0].mainsnak.property} manager=${manager}
            /></strong>
            ${claim.map(
              object =>
                html`<div class="register__label">
                  <${Snack} ...${object} manager=${manager} />
                </div>`,
            )}
          </li>`,
      )}
    </ul>`;
  }
}

export default Register;
