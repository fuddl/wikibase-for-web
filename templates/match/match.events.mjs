export default ({ element, manager, state }) => [
	{
		id: 'submit',
		target: element.querySelectorAll('.match__instance'),
		type: 'submit',
		listener: async function (e) {
			e.preventDefault();
			const formData = new FormData(e.target);
			const edits = [];
			for (const [key, value] of formData) {
				if (!['instance', 'subjectId'].includes(key)) {
					const placeholder = document.createElement('div');
					let newEdit = JSON.parse(value);
					newEdit[newEdit.action === 'wbsetaliases' ? 'id' : 'entity'] =
						formData.get('subjectId');
					newEdit.instance = formData.get('instance');
					edits.push(newEdit);
				}
			}

			browser.browserAction.setPopup({
				popup: browser.runtime.getURL('popup/edit-queue.html'),
			});
			browser.browserAction.openPopup();
			try {
				await browser.runtime.sendMessage(browser.runtime.id, {
					type: 'add_to_edit_queue',
					edits: edits,
				});
			} catch (error) {
				console.error(error);
			}
		},
	},
	{
		id: 'checkvadity',
		target: element.querySelectorAll('.match__instance'),
		type: 'input',
		initial: true,
		listener: async function (e) {
			const submit = e.target.querySelector('.match__send');
			submit.toggleAttribute('disabled', !e.target.checkValidity());
		},
	},
];
