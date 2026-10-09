import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import tryReadDir from '../../fs/tryReadDir.js';
import type UiContext from '../../ui/UiContext.js';
import getUi from '../lib/SchemaUi.js';
import clean from './clean';

vi.mock('node:fs/promises');

vi.mock(import('../../fs/tryReadDir.js'), () => ({
	default: vi.fn(async () => await Promise.resolve([])),
}));

vi.mock(import('../lib/SchemaUi.js'), () => ({
	default: vi.fn(),
}));

const mockGetUi = vi.mocked(getUi);

describe(clean.name, () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('handles missing directories', async () => {
		// Arrange
		const mockUi = buildMockUi(resolve(randomUUID(), 'does', 'not', 'exist'));
		mockGetUi.mockReturnValue(mockUi);

		// Act
		await clean(new Set());

		// Assert
		const mockedRm = vi.mocked(rm);
		expect(mockedRm).not.toHaveBeenCalled();
	});

	// The intent is for the `clean` function (which is only used on a pull)
	// should mimic the behavior of how assets are cleaned, in regards to the
	// filter. See test/integration/asset-filters/asset-filters.cs.test.md
	// section v3 for reasoning.
	//
	// | Included? | Content type exists remotely? | Result           |
	// | --------- | ----------------------------- | ---------------- |
	// | Yes       | Yes                           | Preserve         |
	// | Yes       | No                            | Delete directory |
	// | No        | Either                        | Preserve         |
	//
	it('preserves excluded and cleans included-but-stale', async () => {
		// Arrange
		const excludedUid = 'excluded_type';
		const includedStaleUid = 'included_stale';
		const includedNotStaleUid = 'included_not_stale';
		const mockUi = buildMockUi('/tmp/clean-test', (uid) => uid !== excludedUid);
		mockGetUi.mockReturnValue(mockUi);

		const mockedRm = vi.mocked(rm);
		vi.mocked(tryReadDir).mockResolvedValueOnce([
			{ isDirectory: () => true, name: excludedUid },
			{ isDirectory: () => true, name: includedNotStaleUid },
			{ isDirectory: () => true, name: includedStaleUid },
		] as Awaited<ReturnType<typeof tryReadDir>>);

		// Act
		await clean(new Set([includedNotStaleUid]));

		// Assert
		expect(mockedRm).toHaveBeenCalledTimes(1);
		expect(mockedRm).toHaveBeenCalledWith(
			resolve('/tmp/clean-test', 'entries', includedStaleUid),
			{ recursive: true },
		);
	});
});

function buildMockUi(
	schemaPath: string,
	isIncluded: (contentTypeUid: string) => boolean = () => true,
): UiContext {
	return {
		options: { schema: { entries: { isIncluded }, schemaPath } },
	} as UiContext;
}
