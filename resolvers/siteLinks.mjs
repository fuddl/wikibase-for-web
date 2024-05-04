export const siteLinks = {
  id: "sitelinks",
  pagePathToRegex(urlTemplate) {
    const escapedUrl = urlTemplate.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexPattern = escapedUrl.replace(/\\\$1/g, "([^/#?]+)");
    return new RegExp(`^${regexPattern}$`);
  },
  applies: function (location, { wikibase }) {
    if (!("sites" in wikibase)) {
      return [];
    }
    const proposeEdits = [];
    for (const [id, site] of Object.entries(wikibase.sites)) {
      const regex = this.pagePathToRegex(site.pagePath);
      const matches = location.match(regex);
      if (matches && matches.length > 1) {
        proposeEdits.push({
          action: "sitelink:set",
          sitelink: {
            site: id,
            title: matches[1],
          },
          status: "required",
        });
      }
    }
    return [
      {
        specificity: 1000,
        instance: wikibase.id,
        proposeEdits: proposeEdits,
        matchFromUrl: location,
        directMatch: false,
      },
    ];
  },
  resolve: async function (
    { proposeEdits, matchFromUrl, specificity },
    { wikibase, wikibaseID },
  ) {
  	if (proposeEdits.length < 1) {
  		return [];
  	}
    const siteLink = proposeEdits[0].sitelink;
    const redirect = await fetch(
      `${wikibase.instance}/wiki/Special:ItemByTitle/?site=${siteLink.site}&page=${siteLink.title}`,
      { redirect: "follow" },
    );
    const wikibaseUrl = redirect.url;
    const match = wikibaseUrl.match(/Q\d+$/);
    if (match) {
      return [
        {
          id: `${wikibase.id}:${match[0]}`,
          specificity: specificity,
        },
      ];
    } else {
    	return []
    }
  },
};
