export const siteLinks = {
  id: 'sitelinks',
  pagePathToRegex(urlTemplate) {
    const escapedUrl = urlTemplate.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexPattern = escapedUrl.replace(/\\\$1/g, '([^/#?]+)');
    return new RegExp(`^${regexPattern}`);
  },
  applies: function (location, { wikibase }) {
    if (!('sites' in wikibase)) {
      return [];
    }
    const proposeEdits = [];
    for (const [id, site] of Object.entries(wikibase.sites)) {
      const regex = this.pagePathToRegex(site.pagePath);
      const matches = location.match(regex);
      if (matches && matches.length > 1) {
        return [
          {
            specificity: 1000,
            instance: wikibase.id,
            proposeSummary: browser.i18n.getMessage(
              'match_via_sitelink',
              wikibase.name,
            ),
            proposeEdits: [
              {
                action: 'sitelink:set',
                sitelink: {
                  site: id,
                  title: decodeURIComponent(matches[1]),
                },
                status: 'required',
              },
            ],
            matchFromUrl: location,
            matchSiteId: id,
            matchSiteLink: matches[1],
            directMatch: false,
          },
        ];
      }
    }

    return [];
  },
  resolve: async function (
    { matchSiteLink, matchSiteId, specificity },
    { wikibase, wikibaseID },
  ) {
    const redirect = await fetch(
      `${wikibase.instance}/wiki/Special:ItemByTitle/?site=${matchSiteId}&page=${matchSiteLink}`,
    );

    const wikibaseUrl = redirect.url;
    const match = wikibaseUrl.match(/Q\d+$/);
    if (match === null) {
      return [];
    }

    return [
      {
        id: `${wikibaseID}:${match[0]}`,
        specificity: specificity,
      },
    ];
  },
};
