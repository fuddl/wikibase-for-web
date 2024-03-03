import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';

export default ({ vars, manager }) => {
  const activeEntities = manager.entities
    .filter(entity => entity.active === true)
    .map(entity => entity.id);

  vars.groups = {};
  if (vars.otherMatches) {
    const othermatchesItems = [];
    for (const match of vars.otherMatches) {
      const cached = manager.labelsAndDescrptionsCache[match.id];
      othermatchesItems.push({
        href: manager.urlFromGlobalId(match.id),
        postProcess: !cached ? 'getLabelsAndDescriptions' : null,
        title: cached ? getByUserLanguage(cached.labels)?.value : match.id,
        icon: browser.runtime.getURL('icons/wd.svg'),
        description: cached
          ? getByUserLanguage(cached.descriptions)?.value
          : match.id,
        id: !cached ? match.id : null,
      });
    }
    if (othermatchesItems.length > 0) {
      vars.groups['othermatches'] = {
        items: othermatchesItems,
        title: browser.i18n.getMessage('other_matches_title'),
      };
    }
  }
};
