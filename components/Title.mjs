import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Lament from './Lament.mjs';

const html = htm.bind(h);

class Title extends Component {
  constructor(props) {
    super(props);
    this.state = {
      languages: {},
    };
  }
  componentDidMount() {
    requireStylesheet(browser.runtime.getURL('/components/title.css'));
    const fetchLanguages = async () => {
      const manager = this.props.manager;
      const url = new URL(manager.wikibase.api.instance.apiEndpoint);
      url.search = new URLSearchParams({
        action: 'query',
        meta: 'wbcontentlanguages',
        uselang: manager.languages[0].replace(/-.+/, ''),
        wbclcontext: 'monolingualtext',
        wbclprop: 'code|name',
        format: 'json',
      });

      try {
        const response = await fetch(url);
        const data = await response.json();
        const languagesData = data.query.wbcontentlanguages;

        const languages = Object.keys(languagesData).reduce((acc, key) => {
          acc[languagesData[key].code] = languagesData[key].name;
          return acc;
        }, {});

        this.setState({ languages });
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };

    fetchLanguages();
  }
  render({ text, language }) {
    const myLanguage = this.props.manager.languages[0].replace(/-.+/, '');
    const languageName = this.state?.languages?.[language];
    return html`<span class="title">
      <i lang="${language}" class="title__main">${text}</i> ${language !==
      myLanguage
        ? html`(${languageName
            ? languageName.replace('(', '[').replace(')', ']')
            : language})`
        : null}
    </span>`;
  }
}

export default Title;
