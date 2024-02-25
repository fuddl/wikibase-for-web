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
				if (key !== 'subjectId') {
					const placeholder = document.createElement('div');
					let newEdit = JSON.parse(value);
					newEdit.id = formData.get('subjectId');
					edits.push(newEdit);
				}
			}
			console.debug(edits);
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
