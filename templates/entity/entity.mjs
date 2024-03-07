import { h, Component } from '../../node_modules/preact/dist/preact.mjs';
import htm from '../../node_modules/htm/dist/htm.mjs';
const html = htm.bind(h);
import Ensign from '../ensign/ensign.mjs';
import Remark from '../remark/remark.mjs';

class Entity extends Component {
  render({ labels, descriptions, title, claims, manager }) {
    const urls = null;
    const externalIds = null;
    const mainClaims = Object.values(claims).filter(claim => {
      return !['external-id', 'url'].includes(claim[0].mainsnak.datatype);
    });

    return html`
      <section>
        ${labels && descriptions
          ? html`
              <${Ensign}
                labels=${labels}
                descriptions=${descriptions}
                title=${title} />
            `
          : null}
        ${mainClaims.map(
          claim => html`<${Remark} claim=${claim} manager=${manager} />`,
        )}
        ${
          /*urls
          ? html`
              <h3>
                ${browser.i18n.getMessage(urls.length === 1 ? 'link' : 'links')}
              </h3>
              <${Register} claims=${urls} />
            `
          : null */ ''
        }
        ${
          /*externalIds
          ? html`
              <h3>
                ${browser.i18n.getMessage(
                  externalIds.length === 1 ? 'external_id' : 'external_ids',
                )}
              </h3>
              <${Chart} claims=${externalIds} />
            `
          : null*/ ''
        }
      </section>
    `;
  }
}

export default Entity;
