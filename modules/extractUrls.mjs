export function extractUrls(input) {
	const isUrl = string => {
		try {
			new URL(string);
			return true;
		} catch (e) {
			return false;
		}
	};

	if (typeof input === 'string') {
		return isUrl(input) ? [input] : [];
	} else if (typeof input === 'object' && input !== null) {
		const urls = [];
		for (const key of Object.keys(input)) {
			const value = input[key];
			if (!['url', 'sameAs'].includes(key)) {
				continue;
			}
			if (typeof value === 'string' && isUrl(value)) {
				urls.push(value);
			}
		}
		return urls;
	}
	return [];
}
