document.addEventListener('DOMContentLoaded', () => {
	const checkbox = document.getElementById('enable-experimental');

	// Load saved settings and update checkbox state
	async function loadSettings() {
		const { enableExperimental } =
			await browser.storage.sync.get('enableExperimental');
		checkbox.checked = enableExperimental || false;
	}

	// Save setting immediately when changed
	checkbox.addEventListener('change', async function () {
		await browser.storage.sync.set({
			enableExperimental: checkbox.checked,
		});
		console.log('Settings saved.'); // Optional: for debugging, can be removed
	});

	loadSettings();
});
