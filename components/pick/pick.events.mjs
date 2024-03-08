export default ({ element, manager }) => [
	{
		target: element.querySelectorAll('.pick__option'),
		type: 'click',
		listener: function (e) {
			e.preventDefault();
			manager.navigator.navigate({
				activity: 'view',
				id: this.dataset.id,
			});
		},
	},
];
