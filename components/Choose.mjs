import { h, render, Component } from '../importmap/preact/src/index.js';
import {
	useState,
	useEffect,
	useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import { urlReference } from '../mapping/urlReference.mjs';

import { WikibaseEntityUsageTracker } from '../modules/WikibaseEntityUsageTracker.mjs';

import Thing from './Thing.mjs';
import Word from './Word.mjs';
import Describe from './Describe.mjs';

import { WikibaseItemClaim } from '../types/Claim.mjs';

import useExtraFocus from '../modules/focusExtra.mjs';

import AutoDesc from './AutoDesc.mjs';

const html = htm.bind(h);

// workaround for https://phabricator.wikimedia.org/T271500
async function autocompleteLexemesToSenses(autocomplete, wikibase) {
	const ids = autocomplete.search.map(item => item.id).slice(0, 10);

	//getEntities
	const result = await fetch(
		wikibase.api.getEntities({ ids: ids, props: ['claims'] }),
	).then(res => res.json());

	const senses = [];
	for (const key in result.entities) {
		senses.push(
			result.entities[key].senses.map(sense => {
				const lexeme = autocomplete.search.find(
					item => item.id === sense.id.split('-')[0],
				);
				const gloss = getByUserLanguage(sense.glosses);
				return {
					id: sense.id,
					label: lexeme.label,
					description: lexeme.description,
					gloss: gloss.value,
				};
			}),
		);
	}

	autocomplete.search = senses.flat();
}

const Choose = ({
	id,
	label,
	manager,
	name,
	onAddJobs,
	onSelected,
	onUpdateReference,
	onValueChange,
	placeholder,
	required = false,
	shouldFocus = false,
	subject,
	suggestedEntities,
	type,
	value,
	wikibase,
}) => {
	const [suggestions, setSuggestions] = useState([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [inputValue, setInputValue] = useState('');
	const [shouldFetch, setShouldFetch] = useState(true);
	const [choosenId, setChoosenId] = useState(value);
	const [prevIsFocused, setPrevIsFocused] = useState(false);

	const inputRef = useRef(null);

	const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
		shouldFocus,
		message => {
			if (message.type === 'text_selected') {
				setShouldFetch(true);
				setInputValue(message.value);

				if (onUpdateReference) {
					if (message?.source) {
						onUpdateReference(
							urlReference(message.source, manager.wikibases[wikibase]),
						);
					} else {
						onUpdateReference([]);
					}
				}
			}
			if (message.type === 'resolve_selected') {
				const newlySelectedId =
					message?.candidates?.[0]?.resolved?.[0]?.id.replace(/.+\:/, '');
				if (newlySelectedId) {
					const reference = urlReference(
						message.source,
						manager.wikibases[wikibase],
					);

					if (!choosenId) {
						if (message.source && onUpdateReference) {
							onUpdateReference(reference);
						}
						setInputValue('');
						setChoosenId(
							message.candidates[0].resolved[0].id.replace(/.+\:/, ''),
						);
						setSuggestions([]);
						setShouldFetch(false);
					} else if (choosenId === newlySelectedId) {
						setChoosenId(undefined);
						setInputValue('');
						if (onUpdateReference) {
							onUpdateReference({});
						}
					} else if (onAddJobs) {
						onAddJobs({
							signature: `user_selected:${message.candidates[0].resolved[0].id}:${JSON.stringify(message.source)}`,
							claim: new WikibaseItemClaim({
								value: message.candidates[0].resolved[0].id,
								references: reference,
							}),
						});
					}
				}
			}
		},
		[choosenId],
	);

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/choose.css'));
	}, []);

	useEffect(() => {
		if (subject) {
			if (isFocused) {
				browser.runtime.sendMessage({
					type: 'highlight_elements',
					modes: [type],
					blacklist: [subject],
				});
			} else if (prevIsFocused) {
				browser.runtime.sendMessage({
					type: 'unhighlight_elements',
				});
			}
			setPrevIsFocused(isFocused);
		}
	}, [isFocused, subject]);

	useEffect(() => {
		return async () => {
			if (isFocused) {
				await browser.runtime.sendMessage({
					type: 'unhighlight_elements',
				});
			}
		};
	}, []);

	useEffect(() => {
		setInputValue(label);
	}, [label]);

	useEffect(() => {
		if (suggestedEntities) {
			const defaultSuggestions = suggestedEntities.map(suggestion => {
				return {
					label: null,
					id: suggestion.replace(/.+:/, ''),
				};
			});
			setSuggestions(defaultSuggestions);
		}
	}, [suggestedEntities]);

	useEffect(() => {
		if (onSelected && choosenId !== '') {
			onSelected(choosenId);
		}
		if (onValueChange && choosenId && choosenId !== '') {
			onValueChange({
				name: name,
				value: `${wikibase}:${choosenId}`,
			});
		}
	}, [choosenId]);

	useEffect(() => {
		const fetchSuggestions = async () => {
			const searchUrl = manager.wikibases[wikibase].api.searchEntities({
				search: inputValue,
				// workaround for https://phabricator.wikimedia.org/T271500
				type: type === 'sense' ? 'lexeme' : type,
			});
			const autocomplete = await fetch(searchUrl).then(res => res.json());
			if (autocomplete?.success) {
				if (type === 'item') {
					autocomplete.search.push({
						label: autocomplete.searchinfo.search,
						description: browser.i18n.getMessage('create_new_entity'),
						id: 'CREATE',
					});
				}
				// workaround for https://phabricator.wikimedia.org/T271500
				if (type === 'sense') {
					await autocompleteLexemesToSenses(
						autocomplete,
						manager.wikibases[wikibase],
					);
				}

				if (suggestedEntities) {
					// if there a suggestedEntities, they should be at the top of the list
					const suggestedIds = suggestedEntities.map(item =>
						item.split(':').pop(),
					);
					autocomplete.search.sort((a, b) => {
						const aSuggested = suggestedIds.includes(a.id);
						const bSuggested = suggestedIds.includes(b.id);

						if (aSuggested && !bSuggested) return -1;
						if (!aSuggested && bSuggested) return 1;
						return 0;
					});
				}
				setSuggestions(autocomplete.search);
			}
		};

		if (shouldFetch) {
			if (inputValue !== '') {
				const debounce = setTimeout(() => {
					fetchSuggestions();
				}, 100);
				return () => clearTimeout(debounce);
			} else {
				const tracker = new WikibaseEntityUsageTracker(wikibase);
				const latest = tracker.getLatest(type);
				setSuggestions(latest);
			}
		}
	}, [inputValue, type]);

	useEffect(() => {
		// Only perform the fetch if choosenId is present and inputValue is empty
		if (choosenId && !inputValue) {
			(async () => {
				const designators = await manager.fetchDesignators(
					`${wikibase}:${choosenId}`,
				);
				if (designators) {
					const label = getByUserLanguage(designators.labels);
					if (label?.value) {
						setInputValue(label.value);
					}
				}
			})();
		}
	}, [choosenId, inputValue]);

	const handleKeyDown = e => {
		if (e.key === 'ArrowDown') {
			setSelectedIndex(prevIndex =>
				Math.min(prevIndex + 1, suggestions.length - 1),
			);
			e.preventDefault();
		} else if (e.key === 'ArrowUp') {
			setSelectedIndex(prevIndex => Math.max(prevIndex - 1, 0));
			e.preventDefault();
		} else if (e.key === 'Enter') {
			setInputValue(suggestions[selectedIndex]?.label || '');
			setSuggestions([]);
			setSelectedIndex(-1);
		}
	};

	const autoDescApi = manager.wikibases[wikibase]?.autodesc;

	const makeLabel = ({ label, id }) => {
		if (label) {
			return label;
		}
		if (id.match(/^(Q|P)\d+/)) {
			return html`<${Thing} id=${`${wikibase}:${id}`} manager=${manager} />`;
		}
		if (id.match(/^L\d+/)) {
			return html`<${Word}
				id=${`${wikibase}:${id}`}
				manager=${manager}
				showAppendix="no" />`;
		}
		return id;
	};

	const makeDescription = ({ description, gloss, id }) => {
		if (gloss) {
			return gloss;
		}
		if (description) {
			return description;
		}
		if (description === undefined) {
			return html`<${AutoDesc} id=${id} api=${autoDescApi} />`;
		}
		return html`<${Describe} id=${`${wikibase}:${id}`} manager=${manager} />`;
	};

	return html`
		<div class="choose ${isFocused && 'choose--focus'}" ref=${elementRef}>
			<div class="choose__type-wrap">
				<input
					class="choose__value"
					type="text"
					value=${choosenId}
					required=${required}
					name=${name} />
				<input
					id=${id}
					class="choose__type"
					value=${inputValue}
					onFocus=${handleFocus}
					onBlur=${handleBlur}
					name="search"
					type="search"
					autocomplete="off"
					data-focus="suggested"
					placeholder=${placeholder ??
					browser.i18n.getMessage(`search_${type}_placeholder`)}
					onInput=${e => {
						setInputValue(e.target.value);
						setShouldFetch(true);
					}}
					onKeyDown=${handleKeyDown} />
				<span class="choose__id"
					>${choosenId === 'CREATE'
						? browser.i18n.getMessage('new_entity')
						: choosenId}</span
				>
			</div>
			<div class="choose__picker">
				${suggestions.map(
					(suggestion, index) => html`
						<a
							class=${`choose__picker__pick ${index === selectedIndex ? 'choose__picker__pick--active' : ''}`}
							onMouseUp=${() => {
								setShouldFetch(false);
								setInputValue(suggestion.label);
								setSuggestions([]);
								setChoosenId(suggestion.id);
								setSelectedIndex(-1);
							}}
							onMouseMove=${() => {
								setSelectedIndex(index);
							}}>
							<div class="choose__picker__pick-title">
								${makeLabel(suggestion)}
							</div>
							<div class="choose__picker__pick-description">
								${makeDescription(suggestion)}
							</div>
						</a>
					`,
				)}
			</div>
		</div>
	`;
};

export default Choose;
