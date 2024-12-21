import DismissedEditsAPI from './DismissedEditsAPI.mjs';

export function processEdits(data, jobs) {
	const dismissed = new DismissedEditsAPI();

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
	}

	if (data.matchUrl) {
		jobs.push({
			action: 'resolver:add',
			entity: data.subjectId === 'CREATE' ? 'LAST' : data.subjectId,
			instance: data.instance,
			url: data.matchUrl,
		});
	}
}
