export default async ({ element, instance, manager, addEvents }) => {
	const images = element.querySelectorAll(
		`.remark__object__main ${['img', 'video', 'iframe'].join(', .remark__object__main ')}`,
	);
	if (images.length > 0) {
		const checkHeight = () => {
			const ratio = Array.from(images).reduce((acc, image) => {
				return acc + image.offsetHeight / image.offsetWidth;
			}, 0);
			element.classList.toggle('remark--inline', ratio >= 1);
			element.classList.toggle('remark--poster', ratio < 1);
		};
		checkHeight();

		images.forEach(image => {
			image.addEventListener('load', checkHeight);
		});
	}
};
