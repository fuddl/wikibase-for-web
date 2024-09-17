export async function descriptionsEdits(id, descriptions, manager) {
  const [wikibase, localId] = id.split(':');
  const { languages } = await manager.fetchLanguages(wikibase, 'term');

  const clientLanguages = manager.wikibases[wikibase].languages.map(lang =>
    lang.toLowerCase().replace('_', '-'),
  );

  const edits = [];
  for (const lang of languages) {
    if (lang === 'mul') {
      continue;
    }
    if (!clientLanguages.includes(lang)) {
      continue;
    }
    edits.push({
      action: 'description:set',
      signature: `suggest-description-${lang}`,
      description: {
        id: localId,
        language: lang,
        value: descriptions?.[lang]?.value ?? '',
      },
    });
  }

  return edits;
}
