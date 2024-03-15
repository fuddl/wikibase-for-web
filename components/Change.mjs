import { h, render, Component } from '../node_modules/preact/dist/preact.mjs';
import { useState, useEffect } from '../libraries/preact-hooks.js';
import htm from '../node_modules/htm/dist/htm.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

import Thing from './Thing.mjs';
import Snack from './Snack.mjs';
import Nibble from './Nibble.mjs';
import Specify from './Specify.mjs';

class Change extends Component {
	constructor(props) {
		super(props);
		this.manager = props.manager;
		this.editId = props.editId;
		this.name = props.name;
		this.state = {
			edit: props.edit,
			editMode: false,
		};
	}

	handleDataValueChange = ({ name, value }) => {
		const parts = name
			.slice(this.name.length)
			.split(']')
			.map(part => part.replace(/^\[/, ''));

		this.setState(prevState => {
			let stateRef = prevState;

			parts.forEach((part, index) => {
				// Check if we're at the last part of the path
				if (index === parts.length - 1) {
					// Update the value
					stateRef[part] = value;
				} else {
					// Navigate deeper into the state
					stateRef = stateRef[part];
				}
			});

			return { ...prevState };
		});
	};

	componentDidMount() {
		requireStylesheet(browser.runtime.getURL('/components/change.css'));
	}

	render() {
		const manager = this.manager;

		const getKey = action => {
			switch (action) {
				case 'wbcreateclaim':
					if (this.state.edit?.property) {
						return html`<${Thing}
							id=${this.state.edit.property}
							manager=${manager} />`;
					} else if (this.state.edit?.propertyOptions) {
						return html`<${Specify}
							options=${this.state.edit.propertyOptions}
							manager="${manager}" />`;
					}
				case 'wbsetaliases':
					return browser.i18n.getMessage('set_alias');
			}
		};

		const getValue = action => {
			switch (action) {
				case 'wbcreateclaim':
					if (this.state.edit.datavalue) {
						return html`<${Snack}
							mainsnak=${{
								snaktype: this.state.edit.snaktype,
								datatype: this.state.edit.datatype,
								property: this.state.edit.property,
								datavalue: this.state.edit.datavalue,
							}}
							manager=${manager} />`;
					} else if (edit.valueOptions) {
						return html`<${Specify}
							options=${this.state.edit.valueOptions}
							manager="${manager}" />`;
					}
				case 'wbsetaliases':
					return html`<em>${this.state.edit.add}</em>`;
			}
		};

		return html`
			<div class="change">
				<dl class="change__preview">
					<dt class="change__key">${getKey(this.state.edit.action)}</dt>
					<dd class="change__value" hidden=${this.state.editMode}>
						${getValue(this.state.edit.action)}
						<button
							title="${'Edit mode'}"
							class="change__toggle"
							onClick=${e => {
								e.preventDefault();
								this.setState({ editMode: true });
							}}>
							${'🖊︎'}
						</button>
					</dd>
					<dd class="change__value" hidden=${!this.state.editMode}>
						<${Nibble}
							datatype=${this.state.edit.datatype}
							datavalue=${this.state.edit.datavalue}
							name=${`${this.name}[edit][datavalue]`}
							onValueChange=${this.handleDataValueChange}
							manager=${manager} />
						<button
							title="${'Accept'}"
							class="change__toggle"
							onClick=${e => {
								e.preventDefault();
								this.setState({ editMode: false });
							}}>
							${'✓'}
						</button>
					</dd>
					<dd class="change__bool">
						<input
							name=${`edit-${this.editId}`}
							type="checkbox"
							value="edit-id"
							checked />
					</dd>
				</dl>
			</div>
		`;
	}
}

export default Change;
