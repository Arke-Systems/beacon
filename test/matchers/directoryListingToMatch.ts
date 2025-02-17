import { readdir } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { expect } from 'vitest';

expect.extend({
	async directoryListingToMatch(received: unknown, expected: unknown) {
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

		const opts = { recursive: true };

		const [receivedContents, expectedContents] = await Promise.allSettled([
			readdir(received, opts),
			readdir(expected, opts),
		]);

		if (receivedContents.status === 'rejected') {
			return {
				message: () => `Failed to read directory: ${received}`,
				pass: false,
			};
		}

		if (expectedContents.status === 'rejected') {
			return {
				message: () => `Failed to read directory: ${expected}`,
				pass: false,
			};
		}

		const receivedSorted = receivedContents.value.sort();
		const expectedSorted = expectedContents.value.sort();

		return {
			actual: receivedSorted,
			expected: expectedSorted,
			message: () =>
				this.isNot
					? 'Expected directory contents not to match, but they did'
					: 'Expected directory contents to match, but they did not',
			pass: isDeepStrictEqual(receivedSorted, expectedSorted),
		};
	},
});
