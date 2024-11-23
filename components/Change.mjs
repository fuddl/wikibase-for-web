import {
	h,
	render,
	Component,
	createRef,
} from '../importmap/preact/src/index.js';
import { useState, useEffect } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import DismissedEditsAPI from '../modules/DismissedEditsAPI.mjs';
import { urlReference } from '../mapping/urlReference.mjs';

const html = htm.bind(h);

import Distinguish from './Distinguish.mjs';
import Nibble from './Nibble.mjs';
import Snack from './Snack.mjs';
import Specify from './Specify.mjs';
import Thin from './Thin.mjs';
import Thing from './Thing.mjs';
import Type from './Type.mjs';

class Change extends Component {
	constructor(props) {
		super(props);

		const dismissed = new DismissedEditsAPI();

		this.ref = createRef(null);

		this.manager = props.manager;
		this.editId = props.editId;
		this.name = props.name;
		this.action = props.action;
		this.signature = props?.signature;
		this.subject = props?.subject;
		this.onAddJobs = props?.onAddJobs;
		this.onChange = props?.onChange;

		const empty =
			props.action == 'claim:create' &&
			!props.claim?.hasValue() &&
			!('valueOptions' in props.claim.mainsnak);

		this.state = {
			claim: props?.claim,
			labels: props?.labels,
			description: props?.description,
			sitelink: props?.sitelink,
			editMode: empty,
			active: props.disabledByDefault
				? !props.disabledByDefault
				: !dismissed.isEditDismissed(this.signature),
			invalid: empty,
			languageNames: {},
			hasEditMode: !props?.claim?.mainsnak?.valueOptions?.length > 0,
		};
	}

	checkValidity() {
		// Select all form elements within the fieldset
		const elements = this.ref.current.querySelectorAll(
			'input, select, textarea',
		);

		// Check if any element is invalid using the checkValidity() method
		return Array.from(elements).some(element => !element.checkValidity());
	}

	handleDataValueChange = ({ name, value }) => {
		const invalid = this.checkValidity();

		const parts = name.replace(`${this.name}.`, '').split('.');

		this.setState(prevState => {
			let stateRef = prevState;

			parts.forEach((part, index) => {
				if (index === parts.length - 1) {
					// Update the value at the last part of the path
					stateRef[part] = value;
				} else {
					// Initialize stateRef[part] as an object if undefined before navigating deeper
					// but preserve the array structure if stateRef[part] is an array
					if (stateRef[part] === undefined) {
						stateRef[part] = isNaN(parts[index + 1]) ? {} : [];
					}
					stateRef = stateRef[part];
				}
			});

			prevState.invalid = invalid;

			if (this.onChange) {
				this.onChange();
			}

			return { ...prevState };
		});
	};

	onUpdateReference = references => {
		this.setState(prevState => {
			// Return a new state object with the updated references
			return {
				...prevState,
				claim: {
					...prevState.claim,
					references: references,
				},
			};
		});
	};
	componentDidMount() {
		requireStylesheet(browser.runtime.getURL('/components/change.css'));
		if (['labels:add', 'description:set'].includes(this.action)) {
			(async () => {
				const languages = await this.manager.fetchLanguages(
					this.manager.wikibase.id,
					'term',
				);
				this.setState({ languageNames: languages.languageNames });
			})();
		}
	}

	render() {
		const manager = this.manager;

		const getKey = action => {
			switch (action) {
				case 'claim:create':
					if (this.state.claim?.mainsnak.propertyOptions) {
						return html`<${Specify}
							options=${this.state.claim.mainsnak.propertyOptions}
							manager="${manager}"
							disabled=${!this.state.active}
							name=${`${this.name}.claim.mainsnak.property`}
							value=${this.state.claim?.mainsnak?.property} />`;
					} else if (this.state.claim?.mainsnak.property) {
						return html`<${this.state.active ? Thing : Thin}
								id=${this.state.claim.mainsnak.property}
								manager="${manager}" />
							<input
								value=${this.state.claim.mainsnak.property.replace(
									/^\w+\:/,
									'',
								)}
								name=${`${this.name}.claim.mainsnak.property`}
								type="hidden" /> `;
					}
					break;
				case 'description:set':
					return browser.i18n.getMessage('set_description', [
						this.state.languageNames?.[this.state.description.language] ??
							this.state.description.language,
					]);
				case 'labels:add':
					return browser.i18n.getMessage('set_label_or_alias', [
						this.state.languageNames?.[this.state.labels.language] ??
							this.state.labels.language,
					]);
				case 'sitelink:set':
					return browser.i18n.getMessage('set_sitelink');
			}
		};

		const getValue = action => {
			switch (action) {
				case 'claim:create':
					if (this.state.claim.mainsnak?.datavalue?.value) {
						return html`<${Snack}
							mainsnak=${this.state.claim.mainsnak}
							manager=${manager} />`;
					} else if (this.state.claim.mainsnak.valueOptions) {
						return html`<${Specify}
								options=${this.state.claim.mainsnak.valueOptions}
								manager="${manager}"
								disabled=${!this.state.active}
								name="${this.name}.claim.mainsnak.datavalue.value.id" />
							<input
								type="hidden"
								name="${this.name}.claim.mainsnak.datatype"
								value=${this.state.claim.mainsnak.datatype} />
							<input
								type="hidden"
								name="${this.name}.claim.mainsnak.snaktype"
								value="value" />`;
					}
					break;
				case 'labels:add':
					return html`
						<${Type}
							name="${this.name}.add"
							value="${this.state?.labels.add}" />
						<input
							type="hidden"
							lang=${this.state?.labels.language}
							name="${this.name}.language"
							value="${this.state?.labels.language}" />
					`;
				case 'description:set':
					return html`
						<${Distinguish}
							lang=${this.state?.description.language}
							name="${this.name}.add"
							entity=${this.state?.description?.id}
							required=${true}
							lang=${this.state?.description.language}
							onValueChange=${this.handleDataValueChange}
							value=${this.state?.description.value}
							manager=${manager} />
						<input
							type="hidden"
							name="${this.name}.language"
							value="${this.state?.description.language}" />
					`;
				case 'sitelink:set':
					return html`<div>
						<code>
							<input
								type="hidden"
								name="${this.name}.sitelink.site"
								value="${this.state?.sitelink.site}" />
							<input
								type="hidden"
								name="${this.name}.sitelink.title"
								value="${this.state?.sitelink.title}" />
							${this.state?.sitelink.site}:
							<strong>${this.state?.sitelink.title}</strong>
						</code>
					</div>`;
			}
		};
		return html`
			<fieldset ref=${this.ref} class="change">
				<input
					value=${this.signature}
					name=${`${this.name}.signature`}
					type="hidden" />
				<dl
					class="change__preview ${!this.state.active
						? 'change__preview--disabled'
						: ''}">
					<dt class="change__key">${getKey(this.action)}</dt>
					<dd class="change__value" hidden=${this.state.editMode}>
						${getValue(this.action)}
						${this.state?.claim?.mainsnak.datavalue &&
						this.state.hasEditMode &&
						html`<button
							title="${browser.i18n.getMessage('edit_button')}"
							class="change__toggle"
							hidden=${!this.state.active}
							onClick=${e => {
								e.preventDefault();
								this.setState({ editMode: true });
							}}>
							${'🖊︎'}
						</button>`}
					</dd>
					${this.state?.claim?.mainsnak.datavalue &&
					this.state.hasEditMode &&
					html`<dd class="change__value" hidden=${!this.state.editMode}>
						<${Nibble}
							datatype=${this.state.claim.mainsnak.datatype}
							datavalue=${this.state.claim.mainsnak.datavalue}
							name=${`${this.name}.claim.mainsnak`}
							subject=${this.subject}
							onValueChange=${this.handleDataValueChange}
							onUpdateReference=${this.onUpdateReference}
							property=${this.state.claim?.mainsnak?.property}
							onAddJobs=${job => {
								if (this.onAddJobs && this.state.claim.mainsnak.property) {
									job.claim.setProperty(this.state.claim.mainsnak.property);
									this.onAddJobs(job);
								}
							}}
							manager=${manager} />
						<input
							name=${`${name}.claim.mainsnak.datatype`}
							value=${this.state.claim.datatype}
							type="hidden" />
						<button
							title="${'Accept'}"
							class="change__toggle"
							disabled=${this.state.invalid}
							onClick=${e => {
								e.preventDefault();
								this.setState({ editMode: false });
							}}>
							${this.state.invalid ? '✗' : '✓'}
						</button>
						<input
							type="hidden"
							name=${`${this.name}.claim.type`}
							value="statement" />
						<input
							type="hidden"
							name=${`${this.name}.claim.rank`}
							value="normal" />
					</dd>`}
					<dd class="change__bool">
						<input
							name=${`${this.name}.apply`}
							value="yes"
							type="checkbox"
							onChange=${e => {
								this.setState({ active: !this.state.active });
							}}
							disabled=${this.state.invalid}
							checked=${this.state.active} />
					</dd>
					<dd class="change__qualifiers" hidden=${!this.state.active}>
						${this.state?.claim?.qualifiers &&
						this.state.claim.qualifiers.map(
							(qualifier, index) =>
								html`<dl key=${`qualifier-${index}`}>
									<dt class="change__reference__prop">
										<${Thin}
											id=${qualifier.mainsnak.property}
											manager=${manager} />
										<input
											type="hidden"
											name=${`${this.name}.claim.qualifiers.${index}.property`}
											value=${qualifier.mainsnak.property.replace(/.+:/, '')} />
									</dt>
									<dd class="change__reference__snak">
										<${Snack}
											mainsnak=${qualifier.mainsnak}
											manager=${manager} />
										<div hidden>
											${
												/* maybe we can make this editable in the future 🤷 */ ''
											}
											<${Nibble}
												datatype=${qualifier.mainsnak.datatype}
												datavalue=${qualifier.mainsnak.datavalue}
												name=${`${this.name}.claim.qualifiers.${index}.snak`}
												onValueChange=${this.handleDataValueChange}
												manager=${manager} />
										</div>
									</dd>
								</dl>`,
						)}
						${this.state?.claim?.references?.length > 0 &&
						html`
							<details>
								<summary>${browser.i18n.getMessage('reference')}</summary>
								${this.state.claim.references.map(
									reference =>
										html` <div class="change__reference">
											${Object.entries(reference.snaks).map(
												([prop, statements]) =>
													html` <dl>
														<dt class="change__reference__prop">
															<${Thin} id=${prop} manager=${manager} />
														</dt>
														${statements.map(
															(statement, index) =>
																html`<dd class="change__reference__snak">
																	<${Snack}
																		mainsnak=${statement}
																		manager=${manager} />
																	<div hidden>
																		${
																			/* maybe we can make this editable in the future 🤷 */ ''
																		}
																		<${Nibble}
																			datatype=${statement.datatype}
																			datavalue=${statement.datavalue}
																			name=${`${this.name}.claim.references.${index}.snaks.${prop}.0`}
																			onValueChange=${this
																				.handleDataValueChange}
																			manager=${manager} />
																	</div>
																	<input
																		type="hidden"
																		name=${`${this.name}.claim.references.${index}.snaks.${prop}.0.property`}
																		value=${prop.replace(/.+:/, '')} />
																</dd>`,
														)}
													</dl>`,
											)}
										</div>`,
								)}
							</details>
						`}
					</dd>
				</dl>
				<input
					name=${`${this.name}.action`}
					value="${this.action}"
					type="hidden"
					checked />
			</fieldset>
		`;
	}
}

export default Change;
