export default ({ element, manager, state }) => [{
	id: 'autocomplete',
	target: element.querySelector('.choose__type'),
	type: 'input',
	debounce: 250,
	initial: true,
	listener: async function (e) {
		const key = this.closest('[data-key]').dataset.key
		if (this.value === '' || state?.candidates[key]?.search === this.value) {
			return
		}
		const instanceId = this.closest('[data-instance]').dataset.instance
		const searchUrl = manager.instances[instanceId].api.searchEntities({ search: this.value })
		const autocomplete = await fetch(searchUrl).then(res => res.json())
		const autocompleteWrapper = element.querySelector('.choose__picker')
		autocompleteWrapper.textContent = ''

		const template = element.querySelector('template.choose__picker__pick')
		autocomplete.search.forEach((item) => {
			const itemTemplate = template.firstElementChild.cloneNode(true)

			itemTemplate.setAttribute('href', item.url)

			const labelSlot = itemTemplate.querySelector('[name="label"]')
			labelSlot.parentNode.replaceChild(document.createTextNode(item.label), labelSlot)

			const descriptionSlot = itemTemplate.querySelector('[name="description"]')
			descriptionSlot.parentNode.replaceChild(document.createTextNode(item.description), descriptionSlot)
			
			const idSlot = itemTemplate.querySelector('[name="id"]')
			idSlot.parentNode.replaceChild(document.createTextNode(item.title), idSlot)

			autocompleteWrapper.appendChild(itemTemplate)
		})
	}
}, {
	id: 'keyboard-navigation',
	target: element.querySelector('.choose__type'),
	type: 'keydown',
	listener: (e) => {
		if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
			e.preventDefault()
		}
		const activeClass = 'choose__picker__pick--active';
		const current = element.querySelector(`.${activeClass}`);
		const picks = element.querySelectorAll('.choose__picker__pick');
		const first = picks[0];
		const last = picks[picks.length - 1];
		let newCurrent = current;

		switch (e.key) {
			case 'ArrowDown':
				newCurrent = current && current !== last ? current.nextElementSibling : first;
				break;
			case 'ArrowUp':
				newCurrent = current && current !== first ? current.previousElementSibling : last;
				break;
		}

		if (newCurrent && newCurrent !== current) {
			current?.classList.remove(activeClass);
			newCurrent.classList.add(activeClass);
			newCurrent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	},
}]
