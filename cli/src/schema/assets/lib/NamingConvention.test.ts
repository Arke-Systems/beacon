import { describe, expect, it, vi } from 'vitest';
import { getBlobPath, getItemPath, getMetaPath } from './NamingConvention.js';

vi.mock(import('node:path'), async () => {
	const winPath = await import('node:path/win32');
	return winPath;
});

describe('NamingConvention', () => {
	it('can map an absolute path to a blob path on Windows', () => {
		// Act
		const result = getBlobPath('C:\\cs\\assets\\file.txt');

		// Assert
		expect(result).toBe('C:\\cs\\assets\\file.blob.txt');
	});

	it('can map an item path to a blob path on Windows', () => {
		// Act
		const assetsPath = 'C:\\cs\\assets';
		const itemPath = 'events/some-file.txt';
		const result = getBlobPath(assetsPath, itemPath);

		// Assert
		expect(result).toBe('C:\\cs\\assets\\events\\some-file.blob.txt');
	});

	it('can map an item path to a meta path on Windows', () => {
		// Act
		const assetsPath = 'C:\\cs\\assets';
		const itemPath = 'events/some-file.txt';
		const result = getMetaPath(assetsPath, itemPath);

		// Assert
		expect(result).toBe('C:\\cs\\assets\\events\\some-file.meta.txt.yaml');
	});

	it('can map an absolute path to an item path on Windows', () => {
		// Arrange
		const assetsPath = 'C:\\cs\\assets';
		const absPath = 'C:\\cs\\assets\\events\\some-file.blob.txt';

		// Act
		const result = getItemPath(assetsPath, absPath);

		// Assert
		expect(result).toBe('events/some-file.txt');
	});
});
