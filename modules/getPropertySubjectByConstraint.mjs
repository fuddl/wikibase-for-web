export async function getPropertySubjectByConstraint(suggestion, manager) {
    const instance = manager.wikibases[suggestion.instance];
    const data = await instance.manager.add(
        `${suggestion.instance}:${suggestion.matchProperty}`,
    );
    const relevantClaims = [];

    const scopeMap = {
        wikibaseItem: 'item',
        wikibaseLexeme: 'lexeme',
        wikibaseSense: 'sense',
    };

    const scopes = Object.keys(instance.items).reduce((acc, key) => {
        if (scopeMap[key]) {
            acc[instance.items[key]] = scopeMap[key];
        }
        return acc;
    }, {});

    if (
        !('propertyConstraint' in instance.props) ||
        !('itemOfPropertyConstraint' in instance.props) ||
        !('allowedEntityTypesConstraint' in instance.items)
    ) {
        return 'item';
    }

    let output = [];

    if (data.claims && instance.props.propertyConstraint in data.claims) {
        const constraintClaim = data.claims[instance.props.propertyConstraint];
        constraintClaim.forEach(claim => {
            if (
                claim.mainsnak?.datavalue?.value?.id.endsWith(
                    instance.items.allowedEntityTypesConstraint,
                )
            ) {
                const qualifiers = claim.qualifiers;

                if (
                    qualifiers &&
                    instance.props.itemOfPropertyConstraint in qualifiers
                ) {
                    const values =
                        qualifiers[instance.props.itemOfPropertyConstraint];
                    values.forEach(value => {
                        const constraintItem =
                            value?.datavalue?.value?.id.replace(/^\w+\:/, '');
                        if (constraintItem in scopes) {
                            output.push(scopes[constraintItem]);
                        }
                    });
                }
            }
        });
    }

    return output?.[0] ?? 'item';
}
