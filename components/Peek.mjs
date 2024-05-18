import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

import Change from './Change.mjs';

const html = htm.bind(h);

function Peek({ title, edits, manager }) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/peek.css'));
		setOpen(true);
	}, []);
	return html` <dialog class="peek" open=${open}>
		<h1 class="peek__title">${title}</h1>
		${Object.entries(edits).map(
			([editId, edit]) =>
				html`<${Change}
					key=${editId}
					claim=${edit?.claim}
					labels=${edit?.labels}
					description=${edit?.description}
					sitelink=${edit?.sitelink}
					action=${edit.action}
					signature=${edit?.signature}
					name=${`edits.${editId}`}
					manager=${manager} />`,
		)}
	</dialog>`;
}

export default Peek;
