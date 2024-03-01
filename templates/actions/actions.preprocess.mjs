import { getByUserLanguage } from '../../modules/getByUserLanguage.mjs';

export default ({ vars, manager }) => {
  const activeEntities = manager.entities
    .filter(entity => entity.active === true)
    .map(entity => entity.id);

  vars.groups = {};
  if (vars.otherMatches) {
    for (const match of vars.otherMatches) {
      const key = match.instance;

      const items = [];
      for (const item of match.resolved) {
        if (activeEntities.includes(item)) {
          continue;
        }
        const cached = manager.labelsAndDescrptionsCache[item];

        items.push({
          href: manager.urlFromGlobalId(item),
          postProcess: !cached ? 'getLabelsAndDescriptions' : null,
          title: cached ? getByUserLanguage(cached.labels)?.value : item,
          description: cached
            ? getByUserLanguage(cached.descriptions)?.value
            : item,
          id: !cached ? item : null,
        });
      }
      if (items.length > 0)
        vars.groups[`othermatches-${key}`] = {
          items: items,
          title: browser.i18n.getMessage(
            'contextual_matches_title',
            manager.instances[match.instance].name,
          ),
        };
    }
  }
};
