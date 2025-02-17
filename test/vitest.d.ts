import 'vitest';

// Justification:
// https://vitest.dev/guide/extending-matchers.html#extending-matchers
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */

interface CustomMatchers<R = unknown> {
	directoryListingToMatch: (expected: string) => Promise<R>;
	fileToBeBinaryEqualTo: (expected: string) => Promise<R>;
	isoDateString: () => R;
	toBeErrorFreeTransferResults: () => R;
}

declare module 'vitest' {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
