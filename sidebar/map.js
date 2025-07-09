const mapElement = document.getElementById('map');
mapElement.style.height = '100vh';
mapElement.style.width = '100vw';

const map = L.map('map');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

if (location?.search) {
	const [latStr, lngStr, precStr] = location.search.slice(1).split('/');

	const lat  = parseFloat(latStr);
	const lng  = parseFloat(lngStr);
	const prec = parseFloat(precStr);

	const decimals = Math.ceil(-Math.log10(prec));

	const rLat = Number(lat.toFixed(decimals));
	const rLng = Number(lng.toFixed(decimals));

	map.setView([rLat, rLng], 13);
	L.marker([rLat, rLng]).addTo(map);

	map.scrollWheelZoom.disable();
	map.zoomControl.remove();
}