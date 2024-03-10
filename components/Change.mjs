import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

import Thing from './Thing.mjs';
import Snack from './Snack.mjs';

const Change = ({ editId, edit, manager }) => {
	useState(() => {
		requireStylesheet(browser.runtime.getURL('/components/change.css'));
	}, []);
	return html`
		<dl class="change">
			<dt class="change__key">
				${edit.action === 'wbcreateclaim' && edit?.property
					? html` <${Thing} id=${edit.property} manager=${manager} /> `
					: edit.action === 'wbsetaliases'
						? 'setAlias'
						: ''}
			</dt>
			<dd class="change__value">
				${edit.action === 'wbcreateclaim' && edit.property
					? html`
							<${Snack}
								mainsnak=${{
									snaktype: edit.snaktype,
									datatype: edit.datatype,
									property: edit.property,
									datavalue: { value: edit.value },
								}}
								manager=${manager} />
						`
					: edit.action === 'wbsetaliases'
						? html`<em>${edit.add}</em>`
						: ''}
			</dd>
			<dd class="change__bool">
				<input
					name=${`edit-${editId}`}
					type="checkbox"
					value=${JSON.stringify(edit)}
					checked />
			</dd>
		</dl>
	`;
};

export default Change;
