import Logger from './Logger.mjs';

const defaultUserAgent = 'wikibase-for-web/0.705 (https://github.com/fuddl/wikibase-for-web)';
const logger = new Logger();

export async function fetchWithUserAgent(url, options = {}) {
	const headers = new Headers(options.headers || {});

	if (!headers.has('Api-User-Agent')) {
		headers.set('Api-User-Agent', defaultUserAgent);
	}

	const newOptions = {
		...options,
		headers
	};

	return await fetch(url, newOptions);
}

export async function fetchWithRetry(url, options = {}, retries = 3) {
	let res = await fetchWithUserAgent(url, options);
	while (res.status === 429 && retries > 0) {
		const retryAfter = res.headers.get('Retry-After');
		const delay = retryAfter ? parseInt(retryAfter, 10) : 2;
		logger.warn(`Rate limited (429) for ${url}. Retrying after ${delay}s...`);
		await new Promise(resolve => setTimeout(resolve, delay * 1000));
		res = await fetchWithUserAgent(url, options);
		retries--;
	}
	return res;
}

export async function fetchJSON(url, options = {}, retries = 3) {
	const res = await fetchWithRetry(url, options, retries);

	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status} for ${url}`);
	}

	return res.json();
}
