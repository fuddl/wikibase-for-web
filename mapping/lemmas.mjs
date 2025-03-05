export async function lemmasEdits(id, lemmas, manager) {
  const [wikibase, localId] = id.split(':');
  const { languages: allLanguages } = await manager.fetchLanguages(
    wikibase,
    'term-lexicographical',
  );

  const baseLangs = [
    ...new Set(Object.keys(lemmas).map(lang => lang.split('-')[0])),
  ];

  const relevantLangs = allLanguages
    .filter(lang => {
      const base = lang.split('-')[0];
      return baseLangs.includes(base);
    })
    .sort();

  const edits = [];

  const newLemmas = relevantLangs
    .filter(lang => !Object.keys(lemmas).includes(lang))
    .filter(lang => lang !== 'mis');

  for (const key in lemmas) {
    const data = lemmas[key];
    edits.push({
      action: 'lemma:edit',
      signature: `edit-existing-${data.language}`,
      subject: localId,
      lemma: {
        id: localId,
        language: data.language,
        value: data.value,
      },
    });
  }
  for (const lang of newLemmas) {
    edits.push({
      action: 'lemma:set',
      signature: `edit-suggested-${lang}`,
      subject: localId,
      lemma: {
        id: localId,
        language: lang,
        value: '',
      },
    });
  }

  return edits;
}
