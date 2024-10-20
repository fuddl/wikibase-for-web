import { h, render } from '../importmap/preact/src/index.js';
import { useEffect, useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Experimental from './experimental.mjs';
import Instances from './instances.mjs';

const html = htm.bind(h);

function Options() {
	return html`
		<div>
			<${Experimental} />
			<${Instances} />
		</div>
	`;
}

render(html`<${Options} />`, document.body);
