export const error429 = {
	id: 'error429',
	applies: async function () {
		return [{ specificity: 1, instance: 'test', matchFromUrl: 'test' }];
	},
	resolve: async function () {
		const error = new Error('HTTP error! status: 429 for test-url');
		error.status = 429;
		throw error;
	},
};

export const error5xx = {
	id: 'error5xx',
	applies: async function () {
		return [{ specificity: 1, instance: 'test', matchFromUrl: 'test' }];
	},
	resolve: async function () {
		const error = new Error('HTTP error! status: 500 for test-url');
		error.status = 500;
		throw error;
	},
};
