function sortEntriesByDepth(entries) {
	console.debug(entries);
	// Build a map of entries for easy lookup
	const entryMap = new Map(entries.map(e => [e.prop, e]));

	// Build the graph's adjacency list
	const graph = {};
	entries.forEach(entry => {
		if (entry.parent) {
			if (!graph[entry.parent]) {
				graph[entry.parent] = [];
			}
			graph[entry.parent].push(entry.prop);
		}
	});

	// Perform a depth-first search to sort the entries by depth and assign depth
	let sortedEntries = [];
	function dfs(prop, depth) {
		if (!graph[prop]) {
			return;
		}
		graph[prop].forEach(childProp => {
			const childEntry = entryMap.get(childProp);
			childEntry.depth = depth; // Assign depth
			sortedEntries.push(childEntry);
			dfs(childProp, depth + 1);
		});
	}

	// Start with the root entry (the one with no parent)
	const rootEntry = entries.find(e => e.parent === '');
	rootEntry.depth = 0; // Root has depth 0
	sortedEntries.push(rootEntry);
	dfs(rootEntry.prop, 1); // Children of root start at depth 1

	return sortedEntries;
}

export const equivalentProperties = {
	requiredProps: [
		'equivalentProperty',
		'subpropertyOf',
		'propertyConstraint',
		'propertyScope',
	],
	requiredItems: ['propertyScopeConstraint', 'asMainValue'],
	query: ({ instance, params }) => {
		const http = params.property.replace(/^https:/, 'http:');
		const https = params.property.replace(/^http:/, 'https:');
		return `
			SELECT DISTINCT ?prop ?parent ?type {
				{
					?property p:${instance.props.equivalentProperty}/ps:${instance.props.equivalentProperty} <${http}>.
				} UNION {
					?property p:${instance.props.equivalentProperty}/ps:${instance.props.equivalentProperty} <${https}>.
				}
				?subproperty wdt:${instance.props.subpropertyOf} * ?property.

				?property wikibase:propertyType ?propType.
				BIND (REPLACE(STR(?propType), '.*#([A-Za-z]+)$', '$1') AS ?type)

				?subproperty p:${instance.props.propertyConstraint} ?psc.
				?psc ps:${instance.props.propertyConstraint} wd:${instance.items.propertyScopeConstraint}.
				?psc pq:${instance.props.propertyScope} wd:${instance.items.asMainValue}.

				OPTIONAL { ?subproperty p:${instance.props.equivalentProperty} [ wikibase:rank ?rank ] }
				BIND (REPLACE(STR(?subproperty), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1') AS ?prop)
				BIND (IF(?property = ?subproperty, "", REPLACE(STR(?property), '^.*/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$', '$1')) AS ?parent) 

				BIND (IF(?rank = wikibase:PreferredRank, 1, IF(?rank = wikibase:NormalRank, 2, 3)) AS ?order) 
			}
			ORDER BY ?order
	`;
	},
	cacheTag: ({ instance, params }) => `equivalentProperties:${params.property}`,
	postProcess: ({ results }) => {
		const processed = [];

		results.bindings.forEach(bind => {
			processed.push({
				prop: bind.prop.value,
				parent: bind.parent.value,
				type: bind.type.value,
			});
		});
		if (processed.length === 0) {
			return [];
		}
		return sortEntriesByDepth(processed);
	},
};
