import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
import clean from './clean';

vi.mock('node:fs/promises');

vi.mock(import('../../fs/tryReadDir.js'), () => {
	return { default: async () => Promise.resolve([]) };
});

it('handles missing directories', async () => {
	// Arrange
	const testPath = resolve(randomUUID(), 'does', 'not', 'exist');

	// Act
	await clean(testPath, new Set());

	// Assert
	const mockedRm = vi.mocked(rm);
	expect(mockedRm).not.toHaveBeenCalled();
});
