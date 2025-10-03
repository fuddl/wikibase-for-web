import WikiBaseQueryManager from '../queries/index.mjs';
import { ExternalIdClaim } from '../types/Claim.mjs';

const queryManager = new WikiBaseQueryManager();

export const domain = {
	id: 'domain',
	getDomain: function (location) {
		return URL.parse(location).host.split('.') ?? false;
	},
	applies: function (location, { wikibase }) {
		const domain = this.getDomain(location);
		if (domain.length < 2) {
			return [];
		}

		const proposeEdits = [];
		proposeEdits.push({
			action: 'claim:create',
			claim: new ExternalIdClaim({
				property: `${wikibase.id}:${wikibase.props.domainName}`,
				value: domain.join('.'),
			}),
			status: 'required',
		});

		return [{ specificity: domain.length,
			instance: wikibase.id,
			proposeSummary: browser.i18n.getMessage('match_via_domain', wikibase.name),
			proposeEdits: proposeEdits,
			matchFromUrl: location,
		}];
	},
	expandDomains(domainParts) {
		const result = [];
		for (let i = domainParts.length - 2; i >= 0; i--) {
			result.push(domainParts.slice(i).join('.'));
		}
	  return result;
	},
	resolve: async function ({ matchFromUrl, specificity }, { wikibase, wikibaseID }) {
		const result = await queryManager.query(
			wikibase,
			queryManager.queries.itemByDomain,
			{
				domains: this.expandDomains(this.getDomain(matchFromUrl)),
			},
		)

		if (result.length === 0) {
			return [];
		}

		return [
			{
				specificity: result[0].domain.length,
				id: `${wikibaseID}:${result[0].item}`,
			},
		];
	},
};
