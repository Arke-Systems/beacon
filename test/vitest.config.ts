import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tsconfigPaths({
			projects: [
				'tsconfig.json',
				'cli/src/tsconfig.json',
				'tsconfig.test.json',
			],
		}),
	],
	test: {
		expect: { requireAssertions: true },
		// Some of the integration tests need to be run in isolation because of
		// the ways they mutate data.
		fileParallelism: false,
		include: ['../cli/src/**/*.test.ts', './**/*.test.ts'],
		root: '../',
		setupFiles: [
			'test/matchers/directoryListingToMatch.ts',
			'test/matchers/fileToBeBinaryEqualTo.ts',
			'test/matchers/isoDateString.ts',
			'test/matchers/toBeErrorFreeTransferResults.ts',
		],
	},
});
