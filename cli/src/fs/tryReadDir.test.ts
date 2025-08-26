import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import tryReadDir from './tryReadDir.js';

it('returns an empty array if the directory does not exist', async () => {
	// Arrange
	const testPath = resolve(randomUUID(), 'does', 'not', 'exist');

	// Act
	const result = await tryReadDir(testPath);

	// Assert
	expect(result).toEqual([]);
});
