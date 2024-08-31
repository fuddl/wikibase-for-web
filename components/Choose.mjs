import { h, render, Component } from '../importmap/preact/src/index.js';
import {
	useState,
	useEffect,
	useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

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
	value,
	label,
	name,
	type,
	required = false,
	manager,
	wikibase,
	onSelected,
	onValueChange,
	shouldFocus = false,
}) => {
	const [suggestions, setSuggestions] = useState([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [inputValue, setInputValue] = useState('');
	const [shouldFetch, setShouldFetch] = useState(true);
	const [choosenId, setChoosenId] = useState(value);

	const inputRef = useRef(null);

	const { isFocused, elementRef, handleFocus, handleBlur } = useExtraFocus(
		shouldFocus,
		message => {
			if (message.type === 'text_selected') {
				setShouldFetch(true);
				setInputValue(message.value);
			}
		},
	);

	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/choose.css'));
	}, []);

	useEffect(() => {
		setInputValue(label);
	}, [label]);

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
				setSuggestions(autocomplete.search);
			}
		};

		if (inputValue && shouldFetch) {
			const debounce = setTimeout(() => {
				fetchSuggestions();
			}, 100);
			return () => clearTimeout(debounce);
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

	return html`
		<div class="choose ${isFocused && 'choose--focus'}">
			<div class="choose__type-wrap">
				<input
					class="choose__value"
					type="text"
					value=${choosenId}
					required=${required}
					name=${name} />
				<input
					class="choose__type"
					value=${inputValue}
					onFocus=${handleFocus}
					onBlur=${handleBlur}
					ref=${elementRef}
					name="search"
					type="search"
					autocomplete="off"
					data-focus="suggested"
					placeholder=${browser.i18n.getMessage(`search_${type}_placeholder`)}
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
							onMouseDown=${() => {
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
								${suggestion.label ?? suggestion.id}
							</div>
							<div class="choose__picker__pick-description">
								${suggestion?.description
									? suggestion.description
									: autoDescApi
										? html`<${AutoDesc}
												id=${suggestion.id}
												api=${autoDescApi} />`
										: null}
								${suggestion?.gloss && html`<div>${suggestion.gloss}</div>`}
							</div>
						</a>
					`,
				)}
			</div>
		</div>
	`;
};

export default Choose;
