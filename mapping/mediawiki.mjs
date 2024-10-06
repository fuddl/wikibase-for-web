import { StringClaim, WikibaseItemClaim } from '../types/Claim.mjs';

async function mediaWikiQualifiers(metadata, manager) {
	const qualifiers = [];
	if (metadata.wgTitle && manager.wikibase?.props?.subjectNamedAs) {
		qualifiers.push(
			new StringClaim({
				property: `${manager.wikibase.id}:${manager.wikibase.props.subjectNamedAs}`,
				value: metadata.wgTitle,
			}),
		);
	}

	if (
		metadata?.wgPageContentLanguage &&
		manager.wikibase?.props?.languageOfWorkOrName
	) {
		const languages = await manager.wikibase.manager.query(
			manager.wikibase.id,
			'languageByIso6391Code',
			{ code: metadata.wgPageContentLanguage },
		);
		if (languages) {
			qualifiers.push(
				new WikibaseItemClaim({
					property: `${manager.wikibase.id}:${manager.wikibase.props.languageOfWorkOrName}`,
					value: `${manager.wikibase.id}:${languages[0]}`,
				}),
			);
		}
	}

	if (metadata.wgArticleId && manager.wikibase?.props?.mediaWikiPageId) {
		qualifiers.push(
			new StringClaim({
				property: `${manager.wikibase.id}:${manager.wikibase.props.mediaWikiPageId}`,
				value: metadata.wgArticleId.toString(),
			}),
		);
	}

	return qualifiers;
}

export { mediaWikiQualifiers };
