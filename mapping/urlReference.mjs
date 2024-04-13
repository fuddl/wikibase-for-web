import { MonolingualTextClaim, TimeClaim, UrlClaim } from '../types/Claim.mjs';

export function urlReference(metadata, wikibase) {
	const instance = wikibase.instance;
	const props = wikibase.props;
	const id = wikibase.id;

	let reference = {
		snaks: [],
	};

	if (props?.referenceURL) {
		reference.snaks[`${id}:${props.referenceURL}`] = [
			new UrlClaim({
				property: `${instance}:${props.referenceURL}`,
				value: metadata.location,
			}).mainsnak,
		];
		if (props?.title && metadata?.title) {
			reference.snaks[`${id}:${props.title}`] = [
				new MonolingualTextClaim({
					property: `${instance}:${props.title}`,
					text: metadata.title,
					language: metadata?.lang ? metadata.lang.toLowerCase() : 'und',
				}).mainsnak,
			];
		}
		if (props?.retrieved) {
			let now = new Date();
			reference.snaks[`${id}:${props.retrieved}`] = [
				new TimeClaim({
					property: `${instance}:${props.retrieved}`,
					time: `+${now.toISOString().substr(0, 10)}T00:00:00Z`,
					precision: 11,
				}).mainsnak,
			];
		}
	}
	return [reference];
}
