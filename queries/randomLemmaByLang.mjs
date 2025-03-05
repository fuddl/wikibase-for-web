export const randomLemmaByLang = {
	id: 'language-by-ietgf',
	query: ({ instance, params }) => `
		SELECT ?lemma
		WHERE {
			?lexeme wikibase:lemma ?lemma.
			FILTER (LANG(?lemma) = "${params.lang}").
		} LIMIT 5
	`,
	cacheTag: ({ instance, params }) => `randomLemmaByLang:${params.lang}`,
	postProcess: ({ results }) => {
		const lemmas = [];
		results.bindings.forEach(result => {
			lemmas.push(result.lemma.value);
		});
		return lemmas;
	},
};
