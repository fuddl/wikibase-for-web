export default ({ element, manager }) => [{
	target: element,
	type: 'click',
	listener: (e) => {
		e.preventDefault()
		manager.navigator.navigate({
			activity: 'view',
			id: element.dataset.id,
		})
	}
}]
