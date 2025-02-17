import { expect } from 'vitest';

const isoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

expect.extend({
	isoDateString(received) {
		const { isNot } = this;

		return {
			message: () => `${received} is${isNot ? ' not' : ''} an ISO date string`,
			pass: typeof received === 'string' && isoDate.test(received),
		};
	},
});
