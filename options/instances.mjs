import { h, render } from '../importmap/preact/src/index.js';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import defaultWikibases from '../wikibases.mjs';

const html = htm.bind(h);

// Get custom Wikibases from local storage
async function loadCustomWikibases() {
	const localData = await browser.storage.local.get('customWikibases');
	return localData.customWikibases || {};
}

function Instances() {
	const [instances, setInstances] = useState({});
	const [showForm, setShowForm] = useState(false);
	const [newInstance, setNewInstance] = useState({
		name: '',
		icon: '',
		instance: '',
		sparqlEndpoint: '',
		wgScriptPath: '/w',
	});

	useEffect(() => {
		// Load default and custom Wikibases asynchronously
		const loadWikibases = async () => {
			const customWikibases = await loadCustomWikibases();

			// Merge default Wikibases with custom ones, prioritizing custom data
			const mergedWikibases = { ...defaultWikibases, ...customWikibases };
			setInstances(mergedWikibases);
		};
		loadWikibases();
	}, []);

	const toggleCheckbox = (key, field) => {
		setInstances(prev => ({
			...prev,
			[key]: {
				...prev[key],
				[field]: !prev[key][field],
			},
		}));
	};

	// Fetch icon from the Wiki front page
	const fetchWikiIcon = async instanceUrl => {
		try {
			const response = await fetch(instanceUrl);
			const text = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(text, 'text/html');

			// Look for icon or apple-touch-icon in the HTML
			const iconLink = doc.querySelector('link[rel="icon"]');
			const appleTouchIconLink = doc.querySelector(
				'link[rel="apple-touch-icon"]',
			);

			// Convert relative URL to absolute using the instance's base URL
			const absoluteIconUrl = appleTouchIconLink
				? new URL(appleTouchIconLink.getAttribute('href'), instanceUrl).href
				: iconLink
					? new URL(iconLink.getAttribute('href'), instanceUrl).href
					: `${instanceUrl}/favicon.ico`;

			return absoluteIconUrl;
		} catch (error) {
			console.error('Error fetching icon from the front page:', error);
			return `${instanceUrl}/favicon.ico`; // Fallback to favicon.ico
		}
	};

	// Handle input changes in the add-instance form
	const handleInputChange = async (field, value) => {
		setNewInstance(prev => ({ ...prev, [field]: value }));

		// Fetch data from MediaWiki API and WikibaseManifest when instance URL is filled out
		if (field === 'instance' && value) {
			try {
				// Fetch the WikibaseManifest to check for SPARQL endpoint
				const manifestResponse = await fetch(
					`${value}${newInstance.wgScriptPath}/rest.php/wikibase-manifest/v0/manifest`,
				);
				if (manifestResponse.ok) {
					const manifestData = await manifestResponse.json();
					const sparqlEndpoint =
						manifestData?.external_services?.queryservice || '';
					setNewInstance(prev => ({
						...prev,
						sparqlEndpoint: sparqlEndpoint,
					}));
				}

				// Fetch site info using MediaWiki API
				const apiResponse = await fetch(
					`${value}${newInstance.wgScriptPath}/api.php?action=query&meta=siteinfo&format=json&origin=*`,
				);
				const apiData = await apiResponse.json();
				const siteInfo = apiData.query?.general;

				// Fetch the icon from the front page
				const iconUrl = await fetchWikiIcon(value);

				setNewInstance(prev => ({
					...prev,
					name: siteInfo?.sitename || '',
					icon: iconUrl,
				}));
			} catch (error) {
				console.error('Error fetching site info or manifest:', error);
			}
		}
	};

	// Handle the submission of the new instance form
	const handleAddInstance = async () => {
		if (newInstance.instance) {
			const newId = newInstance.name.toLowerCase().replace(/\s+/g, '-');
			const customWikibases = await loadCustomWikibases();
			const updatedCustomWikibases = {
				...customWikibases,
				[newId]: {
					...newInstance,
					resolve: true,
					disabled: false,
				},
			};

			// Separate the default Wikibases from custom ones before saving to local storage
			const customWikibasesToStore = Object.fromEntries(
				Object.entries(updatedCustomWikibases).filter(
					([key]) => !(key in defaultWikibases),
				),
			);

			// Update state and save only the custom Wikibases to local storage
			setInstances({
				...defaultWikibases,
				...customWikibasesToStore,
			});
			await browser.storage.local.set({
				customWikibases: customWikibasesToStore,
			});

			// Reset the new instance form
			setNewInstance({
				name: '',
				icon: '',
				instance: '',
				sparqlEndpoint: '',
				wgScriptPath: '/w',
			});
			setShowForm(false);
			//browser.runtime.reload();
		}
	};

	return html`
		<table>
			<caption>
				Manage Wikibase Instances
			</caption>
			<thead>
				<tr>
					<th>Icon</th>
					<th>Name</th>
					<th>Instance URL</th>
				</tr>
			</thead>
			<tbody>
				${Object.keys(instances).map(
					key => html`
						<tr>
							<td>
								${instances[key].icon &&
								html`<img
									src=${instances[key].icon}
									alt="${instances[key].name} icon"
									width="20"
									height="20" />`}
							</td>
							<td>${instances[key].name}</td>
							<td>${instances[key].instance}</td>
							<td>
								<input
									type="checkbox"
									disabled=${key === 'wikidata'}
									checked=${!instances[key].disabled}
									onChange=${() => toggleCheckbox(key, 'disabled')} />
							</td>
							<td>
								<input
									type="checkbox"
									checked=${instances[key].resolve}
									onChange=${() => toggleCheckbox(key, 'resolve')} />
							</td>
						</tr>
					`,
				)}
			</tbody>
		</table>

		${showForm &&
		html`
			<div class="new-instance-form">
				<h3>Add New Instance</h3>
				<p>
					<label>
						Instance URL:<br />
						<input
							type="text"
							value=${newInstance.instance}
							onInput=${e => handleInputChange('instance', e.target.value)} />
					</label>
				</p>
				<p>
					<label>
						SPARQL Endpoint:<br />
						<input
							type="text"
							value=${newInstance.sparqlEndpoint}
							onInput=${e =>
								handleInputChange('sparqlEndpoint', e.target.value)} />
					</label>
				</p>
				<p>
					<label>
						wgScriptPath:<br />
						<input
							type="text"
							value=${newInstance.wgScriptPath}
							onInput=${e =>
								handleInputChange('wgScriptPath', e.target.value)} />
					</label>
				</p>
				<p>
					<label>
						Name:<br />
						<input
							type="text"
							value=${newInstance.name}
							onInput=${e => handleInputChange('name', e.target.value)} />
					</label>
				</p>
				<p>
					<label>
						Icon URL:<br />
						<input
							type="text"
							value=${newInstance.icon}
							onInput=${e => handleInputChange('icon', e.target.value)} />
					</label>
				</p>
				<button onClick=${handleAddInstance}>Add Instance</button>
			</div>
		`}
		${!showForm &&
		html`<button onClick=${() => setShowForm(true)}>Add New Instance</button>`}
	`;
}

export default Instances;
