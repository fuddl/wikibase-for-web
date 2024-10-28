import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import { urlReference } from '../mapping/urlReference.mjs';
import dateExtractor from '../modules/dateExtractor.mjs';
import fetchExampleData from '../modules/fetchExampleData.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';
import DateNormalizer from '../modules/DateNormalizer.mjs';

const html = htm.bind(h);

import Type from './Type.mjs';

const Appoint = ({
	datavalue,
	manager,
	name,
	onUpdateReference,
	onValueChange,
	property,
	shouldFocus = false,
	wikibase,
}) => {
	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/appoint.css'));
	}, []);

	const [prevIsFocused, setPrevIsFocused] = useState(false);
	let [vocab, setVocab] = useState([]);
	const [exampleValue, setExampleValue] = useState({});

	const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
		shouldFocus,
		message => {
			if (message.type === 'text_selected') {
				(async () => {
					const languagePresent = vocab.some(
						entry => entry.lang === message.lang,
					);

					if (!languagePresent) {
						const result = await manager.queryManager.query(
							manager.wikibase,
							manager.queryManager.queries.calendarVocabulary,
							{
								languages: [message.lang],
							},
						);
						vocab = [...vocab, ...result];
					}

					const Extractor = new dateExtractor({
						dictionary: vocab,
						lang: message.lang,
					});
					const suggestedDate = Extractor.extract(message.value);

					if (suggestedDate?.time) {
						onValueChange({
							name: `${name}.datavalue.value.time`,
							value: suggestedDate.time,
						});
						if (suggestedDate?.precision) {
							onValueChange({
								name: `${name}.datavalue.value.precision`,
								value: suggestedDate.precision,
							});
						}
					}

					if (onUpdateReference) {
						if (message?.source) {
							onUpdateReference(
								urlReference(message.source, manager.wikibases[wikibase]),
							);
						} else {
							onUpdateReference([]);
						}
					}
				})();
			}

			if (message.type === 'time_selected') {
				const normalisedDate = DateNormalizer.normalizeDateString(
					message.datetime,
				);
				if (normalisedDate) {
					onValueChange({
						name: `${name}.datavalue.value`,
						value: { ...datavalue.value, ...normalisedDate },
					});

					if (message.source && onUpdateReference) {
						const reference = urlReference(
							message.source,
							manager.wikibases[wikibase],
						);
						onUpdateReference(reference);
					}
				}
			}
		},
		[vocab],
	);

	useEffect(() => {
		if (isFocused) {
			browser.runtime.sendMessage({
				type: 'highlight_elements',
				modes: ['time'],
			});
		} else if (prevIsFocused) {
			browser.runtime.sendMessage({
				type: 'unhighlight_elements',
			});
		}
		setPrevIsFocused(isFocused);
	}, [isFocused]);

	useEffect(async () => {
		if (property) {
			const propertyExample = await fetchExampleData(manager, property);

			if (propertyExample) {
				setExampleValue(propertyExample);
			}
		}

		const result = await manager.queryManager.query(
			manager.wikibase,
			manager.queryManager.queries.calendarVocabulary,
		);
		setVocab(result);
	}, []);

	const placeholder = exampleValue?.value?.time
		? browser.i18n.getMessage(
				'placeholder_example_date',
				exampleValue.value.time.match(/\+\d{4}-\d{2}-\d{2}/)[0],
			)
		: '';

	return html`
		<div class="appoint ${isFocused && 'appoint--focus'}" ref=${elementRef}>
			<input
				name="${name}.datavalue.value.after"
				data-type="int"
				type="hidden"
				value=${datavalue.value.after ?? 0} />
			<input
				name="${name}.datavalue.value.before"
				data-type="int"
				type="hidden"
				value=${datavalue.value.before ?? 0} />
			<input
				name="${name}.datavalue.value.calendarmodel"
				type="hidden"
				value=${manager.urlFromIdNonSecure(datavalue.value.calendarmodel)} />
			<input
				name="${name}.datavalue.value.time"
				type="hidden"
				value=${datavalue.value.time} />
			<input
				name="${name}.datavalue.value.timezone"
				type="hidden"
				data-type="int"
				value=${datavalue.value.timezone} />
			<input
				name="${name}.datavalue.value.time"
				type="hidden"
				value=${datavalue.value.time} />
			<input
				value=${datavalue.value.time
					? datavalue.value.time.match(/^([-\+]\d{4}-\d{2}-\d{2})/)[1]
					: ''}
				proxyName="${name}.datavalue.value.time"
				pattern=${'^[\\-+]\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'}
				required=${true}
				type="text"
				class="appoint__type"
				onFocus=${handleFocus}
				placeholder=${placeholder}
				onInput=${e => {
					if (
						e.target.value === '' ||
						!DateNormalizer.isValidDate(e.target.value) ||
						!e.target.checkValidity()
					) {
						return;
					}
					onValueChange({
						name: `${name}.datavalue.value.time`,
						value: `${e.target.value}T00:00:00Z`,
					});
				}} />
			<input
				class="appoint__picker"
				type="date"
				value=${datavalue.value.time
					? datavalue.value.time.match(/^[-\+](\d{4}-\d{2}-\d{2})/)[1]
					: ''}
				proxyName="${name}.datavalue.value.time"
				onInput=${e => {
					if (e.target.value) {
						onValueChange({
							name: `${name}.datavalue.value`,
							value: {
								...datavalue.value,
								time: `+${e.target.value}T00:00:00Z`,
								precision: 11,
							},
						});
					}
				}} />
			<select
				class="appoint__precision"
				name="${name}.datavalue.value.precision"
				onChange=${e => {
					onValueChange({
						name: `${name}.datavalue.value.precision`,
						value: e.target.value,
					});
				}}
				data-type="int">
				${Object.entries({ 11: 'day', 10: 'month', 9: 'year' }).map(
					([value, word]) =>
						html`<option
							value=${value}
							selected=${value == datavalue.value.precision}>
							${browser.i18n.getMessage(`time_precision_${word}`)}
						</option>`,
				)}
			</select>
		</div>
	`;
};

export default Appoint;
