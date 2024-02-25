const mapElement = document.getElementById('map');
mapElement.style.height = '100vh';
mapElement.style.width = '100vw';

const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

if (location?.search) {
	const loc = location?.search.match(/\?(\d+(?:.\d+))\/(\d+(?:.\d+))/);
	loc.shift();
	map.setView(loc, 13);
	map.scrollWheelZoom.disable();
	map.zoomControl.remove();
	const marker = L.marker(loc).addTo(map);
}
