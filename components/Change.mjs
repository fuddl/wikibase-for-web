import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

import Thing from './Thing.mjs';
import Snack from './Snack.mjs';
import Specify from './Specify.mjs';

const Change = ({ editId, edit, manager }) => {
	useState(() => {
		requireStylesheet(browser.runtime.getURL('/components/change.css'));
	}, []);

	const getKey = action => {
		switch (action) {
			case 'wbcreateclaim':
				if (edit?.property) {
					return html`<${Thing} id=${edit.property} manager=${manager} />`;
				} else if (edit?.propertyOptions) {
					return html`<${Specify}
						options=${edit.propertyOptions}
						manager="${manager}" />`;
				}
			case 'wbsetaliases':
				return browser.i18n.getMessage('set_alias');
		}
	};

	const getValue = action => {
		switch (action) {
			case 'wbcreateclaim':
				if (edit.value || edit.datavalue) {
					return html`<${Snack}
						mainsnak=${{
							snaktype: edit.snaktype,
							datatype: edit.datatype,
							property: edit.property,
							datavalue: edit.datavalue ?? { value: edit.value },
						}}
						manager=${manager} />`;
				} else if (edit.valueOptions) {
					return html`<${Specify} options=${edit.valueOptions} />`;
				}
			case 'wbsetaliases':
				return html`<em>${edit.add}</em>`;
		}
	};

	return html`
		<dl class="change">
			<dt class="change__key">${getKey(edit.action)}</dt>
			<dd class="change__value">${getValue(edit.action)}</dd>
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
