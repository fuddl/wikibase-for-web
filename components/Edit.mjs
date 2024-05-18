import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

function Edit({ title, action, icon }) {
	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/edit.css'));
	}, []);
	return html`
		<button
			title=${title ?? browser.i18n.getMessage('edit_button')}
			class="edit"
			onClick=${action}>
			${icon ?? '🖊︎'}
		</button>
	`;
}

export default Edit;
