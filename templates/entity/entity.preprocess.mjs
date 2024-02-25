import { filterBadClaims } from '../../modules/filterBadValues.mjs';

export default ({ vars, manager }) => {
	const instance = manager.getInstance(vars.instance);

	// sort claims by /MediaWiki:Wikibase-SortedProperties
	if (instance?.propOrder?.length > 0) {
		vars.claims = instance.propOrder.reduce((acc, prop) => {
			if (vars.claims[prop]) {
				acc[prop] = vars.claims[prop];
			}
			return acc;
		}, {});
	}

	vars.externalIds = Object.values(vars.claims).filter(claim => {
		return claim[0].mainsnak.datatype === 'external-id';
	});

	vars.urls = Object.values(vars.claims).filter(claim => {
		return claim[0].mainsnak.datatype === 'url';
	});

	vars.mainClaims = Object.values(vars.claims).filter(claim => {
		return !['external-id', 'url'].includes(claim[0].mainsnak.datatype);
	});

	vars.headline_ids = browser.i18n.getMessage(
		vars.externalIds.length === 1 ? 'external_id' : 'external_ids',
	);
	vars.headline_links = browser.i18n.getMessage(
		vars.urls.length === 1 ? 'link' : 'links',
	);

	// filter for best values
	vars.mainClaims = filterBadClaims(vars.mainClaims);
	vars.color = instance.color;
};
