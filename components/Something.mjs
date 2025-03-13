import { h, Component } from '../importmap/preact/src/index.js';
import {
	useState,
	useEffect,
	useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { getByUserLanguage } from '../modules/getByUserLanguage.mjs';

const html = htm.bind(h);

class Something extends Component {
	render({ id, manager }) {
		const [designator, setDesignator] = useState(manager?.designators?.[id]);
		const elementRef = useRef(null);

		useEffect(() => {
			const setUpObserver = () => {
				const observer = new IntersectionObserver(async entries => {
					if (entries[0].isIntersecting) {
						const newDesignators = await manager.fetchDesignators(id);
						setDesignator(newDesignators);
					}
				});

				if (elementRef.current) {
					observer.observe(elementRef.current);
				}

				return () => observer.disconnect();
			};

			return setUpObserver();
		}, [id, manager]);

		let label = designator ? getByUserLanguage(designator.labels) : '';
		let description = designator
			? getByUserLanguage(designator.descriptions)
			: '';

		return html`<span
			class="something"
			lang="${label?.language ?? ''}"
			ref=${elementRef}
			>${description?.value ?? id}</span
		>`;
	}
}

export default Something;
