export default ({ element, manager }) => [
	{
		id: 'navigate',
		target: element,
		type: 'click',
		listener: e => {
			e.preventDefault();
			manager.navigator.navigate({
				activity: 'view',
				id: element.dataset.id,
			});
		},
	},
];
