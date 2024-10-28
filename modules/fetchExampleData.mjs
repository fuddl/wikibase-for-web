export default async function fetchExampleData(manager, property) {
	const [wikibaseId, propertyId] = property.split(':');
	const exampleProperties = [
		'propertyExample',
		'propertyExampleForForms',
		'propertyExampleForLexemes',
		'propertyExampleForProperties',
		'propertyExampleForMedia',
	];
	for (const exampleProperty of exampleProperties) {
		if (manager.wikibases[wikibaseId]?.props?.[exampleProperty]) {
			const propertyEntity = await manager.add(property);
			const propertyExampleId =
				manager.wikibases[wikibaseId]?.props?.[exampleProperty];

			if (propertyExampleId in propertyEntity.claims) {
				const examples = propertyEntity.claims[propertyExampleId];
				// picking an example at random
				const example = examples[Math.floor(Math.random() * examples.length)];

				return example?.qualifiers?.[propertyId][0].datavalue;
			}
		}
	}
}
