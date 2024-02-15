export default async ({ element, manager, addEvents }) => {
	if (addEvents) {
		const options = element.querySelectorAll('.pick__option')
		for (const option of options) {
			option.addEventListener('click', async (e) => {
				e.preventDefault()
				await manager.addAndActivate(option.dataset.id)
			})
		}
	}
}
