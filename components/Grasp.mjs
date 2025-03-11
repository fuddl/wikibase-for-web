import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';
import Thing from './Thing.mjs';
import Gloss from './Gloss.mjs';

const html = htm.bind(h);

function Grasp({ senses, manager }) {
	useEffect(() => {
		requireStylesheet(browser.runtime.getURL('/components/grasp.css'));
	}, []);

	const hyperProp =
		'hyperonym' in manager.wikibase.props
			? manager.wikibase.props.hyperonym
			: false;

	const senseById = {};
	senses.forEach(sense => {
		senseById[sense.id] = { ...sense, children: [] };
	});

	const topSenses = [];
	senses.forEach(sense => {
		let hyperonymId = false;
		if (hyperProp in sense.claims) {
			hyperonymId = sense.claims[hyperProp]
				.map(claim => claim.mainsnak?.datavalue?.value?.id)
				.find(Boolean);
		}
		if (hyperonymId && senseById[hyperonymId]) {
			senseById[hyperonymId].children.push(senseById[sense.id]);
		} else {
			topSenses.push(senseById[sense.id]);
		}
	});

	function getNumberFormatter(locale, level) {
		if (level === 1) {
			if (locale.startsWith('zh') || locale.startsWith('ja')) {
				return new Intl.NumberFormat(locale, { numberingSystem: 'hanidec' });
			}
			return new Intl.NumberFormat(locale);
		}
		return null;
	}

	function numberToLetter(n) {
		return String.fromCharCode(96 + n);
	}

	// General formatter per level.
	function formatOrdinal(num, level, locale) {
		if (level === 1) {
			return getNumberFormatter(locale, level).format(num);
		} else if (level === 2) {
			return numberToLetter(num);
		}
		// Fallback to default numeric formatting for deeper levels.
		return num.toString();
	}

	// Get the user's locale.
	const userLocale = (manager && manager.userLocale) || navigator.language;

	// Recursively render senses while accumulating ordinal numbers.
	// The "prefix" argument holds the parent's ordinal string (e.g. "1" or "1.a").
	function renderSenses(sensesArr, level = 1, prefix = '') {
		return sensesArr.map((sense, idx) => {
			// Compute the current ordinal segment for this sense.
			const currentOrdinalSegment = formatOrdinal(idx + 1, level, userLocale);
			// Build the full ordinal string, inheriting parent's ordinal.
			const fullOrdinal = prefix
				? `${prefix}${currentOrdinalSegment}`
				: currentOrdinalSegment;
			return html`
				<dt class="grasp__id" key=${`${sense.id}-id`}>${fullOrdinal}</dt>
				<dd class="grasp__gloss" key=${`${sense.id}-gloss`}>
					<${Gloss} sense=${sense} manager=${manager} />
				</dd>
				${sense.children.length > 0
					? html`
							<dd class="grasp__subsenses">
								<dl class="grasp">
									${renderSenses(sense.children, level + 1, fullOrdinal)}
								</dl>
							</dd>
						`
					: null}
			`;
		});
	}

	return html` <dl class="grasp">${renderSenses(topSenses)}</dl> `;
}

export default Grasp;
