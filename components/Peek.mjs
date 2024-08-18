import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { formDataToData } from '../modules/formDataToData.mjs';
import { processEdits } from '../modules/processEdits.js';

import Choose from './Choose.mjs';
import Change from './Change.mjs';
import Engage from './Engage.mjs';

import { claimTypeMap } from '../types/Claim.mjs';

const html = htm.bind(h);

const close = async () => {
	await browser.runtime.sendMessage({
		type: 'request_workbench',
		workbench: false,
	});
};

const submit = e => {
	e.preventDefault();

	const data = formDataToData(e.target.form);

	const jobs = [];

	processEdits(data, jobs);

	try {
		browser.runtime.sendMessage({
			type: 'add_to_edit_queue',
			edits: jobs,
		});
		close();
	} catch (error) {
		console.error(error);
	}
};

function Peek({ title, edits: initialEdits, subjectId, manager }) {
	const [open, setOpen] = useState(false);
	const [edits, setEdits] = useState(initialEdits);

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/peek.css'));
		setOpen(true);
	}, []);
	return html`<dialog class="peek" open=${open}>
		<header class="peek__head">
			<h1 class="peek__title">${title}</h1>
			<button class="peek__close" onClick=${e => close()}>${'❌︎'}</button>
		</header>
		<form>
			<input type="hidden" name="instance" value=${manager.wikibase.id} />
			<input
				type="hidden"
				name="subjectId"
				value=${subjectId.replace(/.+:/, '')} />
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
			${edits.length === 0 &&
			html` <${Choose}
				manager=${manager}
				wikibase=${manager.wikibase.id}
				name="propertyId"
				type="property"
				required="true"
				onSelected=${async id => {
					const chosenProp = [manager.wikibase.id, id].join(':');
					const property = await manager.add(chosenProp);
					setEdits([
						{
							action: 'claim:create',
							claim: new claimTypeMap[property.datatype]({
								property: chosenProp,
							}),
						},
					]);
				}} />`}
			<footer class="peek__footer">
				<${Engage}
					disabled=${edits.length === 0}
					text=${browser.i18n.getMessage('send_to_instance', [
						manager.wikibase.name,
					])}
					onClick=${e => {
						submit(e);
					}} />
			</footer>
		</form>
	</dialog>`;
}

export default Peek;
