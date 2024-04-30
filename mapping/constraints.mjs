import { WikibaseItemClaim } from '../types/Claim.mjs';

export async function constraintsToEdits(id, wikibase) {
	const newEdits = [];

	if (
		!('props' in wikibase) ||
		!('propertyConstraint' in wikibase.props) ||
		!('property' in wikibase.props)
	) {
		return newEdits;
	}

	const props = wikibase?.props;
	const items = wikibase?.items;

	if (!props || !props?.propertyConstraint || !items) {
		return newEdits;
	}

	const property = await wikibase.manager.add(id);

	if (!(props.propertyConstraint in property.claims)) {
		return newEdits;
	}

	const constrains = property.claims[props.propertyConstraint];
	for (const prop of constrains) {
		if (!prop.mainsnak?.datavalue?.value?.id) {
			continue;
		}

		switch (prop.mainsnak.datavalue.value.id.replace(/^.+\:/, '')) {
			case items?.itemRequiresStatementConstraint:
				let cprops = [];
				if (props.property in prop.qualifiers) {
					cprops = prop.qualifiers[props.property].map(
						item => item?.datavalue?.value?.id,
					);
				}
				let citems = [];
				if (
					props?.itemOfPropertyConstraint &&
					props.itemOfPropertyConstraint in prop.qualifiers
				) {
					citems = prop.qualifiers[props.itemOfPropertyConstraint].map(
						item => item?.datavalue?.value?.id,
					);
				}
				cprops.forEach(cprop => {
					citems.forEach(citem => {
						newEdits.push({
							action: 'claim:create',
							signature: `constraint:${prop.id}`,
							claim: new WikibaseItemClaim({
								property: cprop,
								value: citem,
							}),
						});
					});
				});
				break;
			case items?.subjectTypeConstraint:
				let cclasses = [];
				if ('class' in props && props.class in prop.qualifiers) {
					cclasses = prop.qualifiers[props.class].map(
						item => item?.datavalue?.value?.id,
					);
				}
				let crelations = [];
				if ('relation' in props && props.relation in prop.qualifiers) {
					crelations = prop.qualifiers[props.relation].map(item =>
						item?.datavalue?.value?.id.replace(/^.+\:/, ''),
					);
				}
				if ('instanceOf' in items && crelations.includes(items.instanceOf)) {
					newEdits.push({
						action: 'claim:create',
						signature: `constraint:${prop.id}`,
						claim: new WikibaseItemClaim({
							property: `${wikibase.id}:${props.instanceOf}`,
							value: cclasses[0],
						}),
					});
				}
				if (
					'instanceOrSubclassOf' in items &&
					crelations.includes(items.instanceOrSubclassOf)
				) {
					const possibleClasses = await wikibase.manager.query(
						wikibase.id,
						'instancesOrSubclasses',
						{
							superClasses: cclasses.map(cclass => cclass.replace(/^.+\:/, '')),
						},
					);

					newEdits.push({
						action: 'claim:create',
						signature: `constraint:${prop.id}`,
						claim: new WikibaseItemClaim({
							property: `${wikibase.id}:${props.instanceOf}`,
							value: possibleClasses.map(
								possibleClass => `${wikibase.id}:${possibleClass}`,
							),
						}),
					});
				}
				break;
		}
	}

	return newEdits;
}
