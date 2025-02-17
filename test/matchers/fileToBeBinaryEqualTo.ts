import { readFile } from 'node:fs/promises';
import { expect } from 'vitest';

expect.extend({
	async fileToBeBinaryEqualTo(received: unknown, expected: unknown) {
		if (typeof received !== 'string') {
			return {
				message: () => `Expected a string, but got ${typeof received}`,
				pass: false,
			};
		}

		if (typeof expected !== 'string') {
			return {
				message: () => `Expected a string, but got ${typeof expected}`,
				pass: false,
			};
		}

		const [receivedData, expectedData] = await Promise.allSettled([
			readFile(received),
			readFile(expected),
		]);

		if (receivedData.status === 'rejected') {
			return {
				message: () => `Failed to read file: ${received}`,
				pass: false,
			};
		}

		if (expectedData.status === 'rejected') {
			return {
				message: () => `Failed to read file: ${expected}`,
				pass: false,
			};
		}

		return {
			actual: receivedData.value,
			expected: expectedData.value,
			message: () =>
				`Expected files${this.isNot ? ' not ' : ' '}to be binary equal`,
			pass: receivedData.value.equals(expectedData.value),
		};
	},
});
