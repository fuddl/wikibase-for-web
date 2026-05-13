const queryString = window.location.search;
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get('controls') == 'false') {
	const style = document.createElement('style');
	style.textContent = `
		.maplibregl-ctrl-top-right {
			opacity: 0;
			transition: .25s opacity;
			:root:hover & {
				opacity: 1;
			}
		}`;
	document.head.appendChild(style);
}

if (urlParams.get('attribution') == 'minimal') {
	const style = document.createElement('style');
	style.textContent = '.maplibregl-ctrl-bottom-right { display: none !important; }';
	document.head.appendChild(style);

	const minimalAttribution = document.createElement('aside');
	minimalAttribution.classList.add('minimal-attribution');

	const minimalAttributionStyle = document.createElement('style');
	minimalAttributionStyle.textContent = 
	`.minimal-attribution {
	  position: absolute;
	  inset: auto 0px 0px auto;
	  background-color: rgba(255, 255, 255, 0.5);
	  padding: 0px 5px;
		color: rgba(0,0,0,.75);
		font: 12px/20px Helvetica Neue,Arial,Helvetica,sans-serif;
		a {
			color: inherit;
		}
	}`

	document.head.appendChild(minimalAttributionStyle);

	const textNode = document.createTextNode('© ');
	const link = document.createElement('a');
	link.href = 'https://www.openstreetmap.org/copyright';
	link.target = '_blank';
	link.textContent = 'OpenStreetMap';
	minimalAttribution.appendChild(textNode);
	minimalAttribution.appendChild(link);

	const donateLink = document.createElement('a');
  donateLink.href = 'https://donate.openstreetmap.org';
  donateLink.target = '_blank';
  donateLink.textContent = ' ♥';
  donateLink.title = 'Make a Donation';
  donateLink.style.textDecoration = 'none';
	minimalAttribution.appendChild(donateLink);

	document.body.appendChild(minimalAttribution);
}
