export default ({ element, manager }) => [{
	target: element.querySelector('.main__back'),
	type: 'click',
	listener: (target) => {
		manager.navigator.back()
	}
}]
