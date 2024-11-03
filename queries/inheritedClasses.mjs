export const inheritedClasses = {
	id: 'inherited-classes',
	requiredProps: ['subclassOf'],
	query: ({ instance, params }) => {
		console.debug(params);
		return `
			SELECT DISTINCT ?inheritedClass WHERE {

				${params.classes
					.map(
						classId => `
					{ wd:${classId} wdt:${instance.props.subclassOf}* ?inheritedClass. }
					UNION 
					{ BIND (wd:${classId} as ?inheritedClass) }
				`,
					)
					.join(' UNION ')}

				# Ensure that ?inheritedClass is bound (only distinct inherited classes)
				FILTER (BOUND(?inheritedClass))
			}
		`;
	},
	cacheTag: ({ instance, params }) =>
		`inheritedClasses:${params.classes.join('|')}`,
	postProcess: ({ results }, params, instance) => {
		const processed = new Set();

		results.bindings.forEach(bind => {
			const inheritedClass = bind.inheritedClass.value.replace(
				/^.*\/([A-Z]+[0-9]+(-[A-Z0-9]+)?)$/,
				`${instance.id}:$1`,
			);
			processed.add(inheritedClass);
		});

		return Array.from(processed);
	},
};
