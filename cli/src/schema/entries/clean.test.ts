import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
import clean from './clean';

vi.mock('node:fs/promises');

vi.mock(import('../../fs/tryReadDir.js'), () => ({
	default: vi.fn(async () => await Promise.resolve([])),
}));

import tryReadDir from '../../fs/tryReadDir.js';

it('handles missing directories', async () => {
	// Arrange
	const testPath = resolve(randomUUID(), 'does', 'not', 'exist');

	// Act
	await clean(testPath, new Set());

	// Assert
	const mockedRm = vi.mocked(rm);
	expect(mockedRm).not.toHaveBeenCalled();
});

it('preserves excluded directories and cleans included stale directories', async () => {
	const mockedRm = vi.mocked(rm);
	mockedRm.mockClear();
	vi.mocked(tryReadDir).mockResolvedValueOnce([
		{ isDirectory: () => true, name: 'archived_post' },
		{ isDirectory: () => true, name: 'blog_post' },
	] as Awaited<ReturnType<typeof tryReadDir>>);

	await clean(
		'/tmp/beacon-clean-test',
		new Set(),
		(uid) => uid !== 'archived_post',
	);

	expect(mockedRm).toHaveBeenCalledTimes(1);
	expect(mockedRm).toHaveBeenCalledWith(
		resolve('/tmp/beacon-clean-test', 'entries', 'blog_post'),
		{ recursive: true },
	);
});
