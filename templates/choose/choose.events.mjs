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
			itemTemplate.dataset.id = item.title

			const labelSlot = itemTemplate.querySelector('[name="label"]')
			labelSlot.parentNode.replaceChild(document.createTextNode(item.label), labelSlot)

			const descriptionSlot = itemTemplate.querySelector('[name="description"]')
			descriptionSlot.parentNode.replaceChild(document.createTextNode(item.description), descriptionSlot)

			autocompleteWrapper.appendChild(itemTemplate)
		})
		e.target.classList.toggle('choose__type--picker-open', autocompleteWrapper.childElementCount > 0)
	}
}, {
	id: 'keyboard-navigation',
	target: element.querySelector('.choose__type'),
	type: 'keydown',
	listener: (e) => {
		if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
		    e.preventDefault();
		    const scrollOptions = { behavior: 'smooth', block: 'nearest' }

		    const activeClass = 'choose__picker__pick--active';
		    const current = element.querySelector(`.${activeClass}`);
		    const picks = element.querySelectorAll('.choose__picker > .choose__picker__pick');
		    const first = picks[0];
		    const last = picks[picks.length - 1];

		    if (current && e.key === 'Enter') {
		    	e.target.nextElementSibling.innerText = current.dataset.id
		    	e.target.value = current.querySelector('.choose__picker__pick-title').textContent.trim()
		    	current.parentNode.innerText = ''
		    }

		    // If the user presses down while current is null, set first to be active and scroll into view
		    if (!current && e.key === 'ArrowDown') {
		        first.classList.add(activeClass);
		        first.scrollIntoView(scrollOptions);
		        return;
		    }

		    // Handling when the current is the last and the user presses down, do nothing
		    if (current === last && e.key === 'ArrowDown') {
		        return;
		    }

		    // Handling ArrowDown: Set the next element sibling active
		    if (e.key === 'ArrowDown' && current !== last) {
		        const next = current.nextElementSibling;
		        current.classList.remove(activeClass);
		        next.classList.add(activeClass);
		        next.scrollIntoView(scrollOptions);
		        return;
		    }

		    // Handling ArrowUp: If the first is active, element should scroll into view
		    if (e.key === 'ArrowUp' && current === first) {
		    	current.classList.remove(activeClass)
		        e.target.scrollIntoView();
		        return;
		    }

		    // Handling ArrowUp: Set the previous element sibling active
		    if (e.key === 'ArrowUp' && current !== first) {
		        const previous = current.previousElementSibling;
		        current.classList.remove(activeClass);
		        previous.classList.add(activeClass);
		        previous.scrollIntoView(scrollOptions);
		    }
		}
	},
}]
