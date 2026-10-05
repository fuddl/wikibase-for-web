import DismissedEditsAPI from './DismissedEditsAPI.mjs';

export function processEdits(data, jobs) {
	const dismissed = new DismissedEditsAPI();

	// resolver:add only depends on the entity ID being known, not on any
	// claim/qualifier/reference jobs. Insert it as early as possible:
	// - right after entity:create when subjectId is CREATE (so it's position 1)
	// - at the very start when the entity ID is already explicit
	// We track the insertion index and splice it in after the loop.
	let resolverInsertIndex = jobs.length; // default: after existing jobs

	for (const edit of data.edits) {
		if (edit.signature) {
			dismissed.toggleDismissedEdit(edit.signature, !edit.apply);
		}
		if (!edit.apply) {
			continue;
		}
		const subject = edit?.subject ?? data.subjectId;

		if (edit?.action === 'claim:create') {
			jobs.push({
				action: edit.action,
				instance: data.instance,
				entity: subject === 'CREATE' ? 'LAST' : subject,
				claim: edit.claim,
			});

			if (edit?.claim?.qualifiers) {
				edit.claim.qualifiers.forEach(qualifier => {
					jobs.push({
						action: 'qualifier:set',
						instance: data.instance,
						statement: 'LAST',
						value: qualifier.snak.datavalue,
						property: qualifier.property,
						snaktype: qualifier.snak.snaktype,
					});
				});
			}

			if (edit?.claim?.references) {
				edit.claim.references.forEach(reference => {
					jobs.push({
						action: 'reference:set',
						instance: data.instance,
						statement: 'LAST',
						snaks: reference.snaks,
					});
				});
			}
		}
		if (edit?.action === 'entity:create') {
			jobs.push({
				action: edit.action,
				instance: data.instance,
				new: edit.new,
				data: edit.data,
			});
			// resolver:add should follow immediately after entity:create
			resolverInsertIndex = jobs.length;
		}
		if (edit?.action === 'sitelink:set') {
			jobs.push({
				action: edit.action,
				instance: data.instance,
				entity: subject === 'CREATE' ? 'LAST' : subject,
				sitelink: edit.sitelink,
			});
		}
		if (edit?.action === 'labels:add') {
			jobs.push({
				action: edit.action,
				instance: data.instance,
				entity: subject === 'CREATE' ? 'LAST' : subject,
				add: edit.add,
				language: edit.language,
			});
		}
		if (edit?.action === 'description:set') {
			jobs.push({
				action: edit.action,
				instance: data.instance,
				entity: subject === 'CREATE' ? 'LAST' : subject,
				value: edit.add,
				language: edit.language,
			});
		}
		if (edit?.action === 'lemma:set' || edit?.action === 'lemma:edit') {
			if (edit.lemma.value) {
				jobs.push({
					action: edit.action,
					instance: data.instance,
					entity: subject === 'CREATE' ? 'LAST' : subject,
					value: edit.lemma.value,
					language: edit.lemma.language,
				});
			} else if (edit?.action === 'lemma:edit') {
				jobs.push({
					action: 'lemma:remove',
					instance: data.instance,
					entity: subject === 'CREATE' ? 'LAST' : subject,
					language: edit.lemma.language,
				});
			}
		}
	}

	if (data.matchUrl) {
		// Insert resolver:add at the earliest valid position: right after
		// entity:create (so lastEntity is set), or at the top when the
		// entity ID is already explicit and no create job exists.
		const resolverJob = {
			action: 'resolver:add',
			entity: data.subjectId === 'CREATE' ? 'LAST' : data.subjectId,
			instance: data.instance,
			url: data.matchUrl,
		};
		jobs.splice(resolverInsertIndex, 0, resolverJob);
	}
}

