import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import {
	useState,
	useEffect,
	useRef,
} from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { formDataToData } from '../modules/formDataToData.mjs';
import { processEdits } from '../modules/processEdits.js';
import Logger from '../modules/Logger.mjs';

const logger = new Logger();

import Choose from './Choose.mjs';
import Change from './Change.mjs';
import Engage from './Engage.mjs';
import List from './List.mjs';

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

	logger.log('Processing edits');

	processEdits(data, jobs);

	logger.log('Prepered edit jobs', jobs);

	try {
		browser.runtime.sendMessage({
			type: 'add_to_edit_queue',
			edits: jobs,
		});
		close();
	} catch (error) {
		logger.jobs('Failed to send jobs', error, 'error');
	}
};

function Peek({ title, edits: initialEdits, subjectId, manager, view }) {
	const [open, setOpen] = useState(false);
	const [edits, setEdits] = useState(initialEdits);
	const formRef = useRef(null);

	const localSubjectId = subjectId.replace(/.+:/, '');

	const handleAddJobs = ({ signature, claim }) => {
		setEdits(currentEdits => {
			const index = currentEdits.findIndex(
				edit => edit.signature === signature,
			);

			if (index !== -1) {
				if (currentEdits.length === 1) {
					return [
						{
							...currentEdits[index],
							claim: { ...currentEdits[index].claim, value: undefined },
						},
					];
				} else {
					const newEdits = currentEdits.filter((_, idx) => idx !== index);
					return newEdits;
				}
			} else {
				return [
					...currentEdits,
					{
						action: 'claim:create',
						claim: claim,
						signature: signature,
					},
				];
			}
		});
	};

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/peek.css'));
		setOpen(true);
	}, []);

	const highlightJobs = async () => {
		const data = formDataToData(formRef.current);

		await browser.runtime.sendMessage({
			type: 'highlight_jobs',
			edits: edits,
		});
	};

	useEffect(async () => {
		if (edits) {
			await highlightJobs();
		}
	}, [edits]);

	return html`<dialog class="peek" open=${open}>
		<header class="peek__head">
			<h1 class="peek__title">${title}</h1>
			<button class="peek__close" onClick=${e => close()}>${'❌︎'}</button>
		</header>
		${edits &&
		html`<form ref=${formRef}>
			<input type="hidden" name="instance" value=${manager.wikibase.id} />
			<input type="hidden" name="subjectId" value=${localSubjectId} />
			${Object.entries(edits).map(
				([editId, edit]) =>
					html`<${Change}
						key=${edit?.signature ?? editId}
						claim=${edit?.claim}
						labels=${edit?.labels}
						description=${edit?.description}
						sitelink=${edit?.sitelink}
						action=${edit.action}
						subject=${subjectId}
						onChange=${highlightJobs}
						signature=${edit?.signature}
						onAddJobs=${handleAddJobs}
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
							signature: 'user_created',
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
		</form>`}
		${view && html`<${List} type=${view} id=${subjectId} manager=${manager} />`}
	</dialog>`;
}

export default Peek;
