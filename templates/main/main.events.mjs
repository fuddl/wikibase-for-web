export default ({ element, manager }) => [{
	id: 'go-back',
	target: element.querySelector('.main__back'),
	type: 'click',
	listener: (target) => {
		manager.navigator.back()
	}
}]
