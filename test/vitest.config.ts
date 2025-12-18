import tsconfigPaths from 'vite-tsconfig-paths';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
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
		env: loadEnv(mode, process.cwd(), ''),
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
}));
