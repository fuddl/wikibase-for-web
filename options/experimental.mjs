import { h, render } from '../importmap/preact/src/index.js';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

const html = htm.bind(h);

function Experimental() {
	const [enableExperimental, setEnableExperimental] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			const { enableExperimental } =
				await browser.storage.sync.get('enableExperimental');
			setEnableExperimental(enableExperimental || false);
		};
		loadData();
	}, []);

	// Handle changes to the experimental option
	const handleExperimentalChange = async event => {
		const checked = event.target.checked;
		setEnableExperimental(checked);
		await browser.storage.sync.set({ enableExperimental: checked });
		console.log('Experimental setting saved.');
	};

	return html`
		<p>
			<input
				type="checkbox"
				id="enable-experimental"
				checked=${enableExperimental}
				onChange=${handleExperimentalChange} />
			<label for="enable-experimental">Enable Experimental Features</label>
		</p>
	`;
}

export default Experimental;
