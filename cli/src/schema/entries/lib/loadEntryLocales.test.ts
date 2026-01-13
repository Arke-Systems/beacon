import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PathLike } from 'node:fs';
import loadEntryLocales from './loadEntryLocales.js';

// Mock the file system modules
vi.mock('node:fs/promises', () => ({
	readdir: vi.fn(),
}));

vi.mock('#cli/fs/readYaml.js', () => ({
	default: vi.fn(),
}));

describe(loadEntryLocales.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return empty array when directory does not exist', async () => {
		const { readdir } = await import('node:fs/promises');
		vi.mocked(readdir).mockRejectedValue({ code: 'ENOENT' });

		const result = await loadEntryLocales(
			'/nonexistent/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result).toEqual([]);
	});

	it('should load single locale file without suffix', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		vi.mocked(readdir).mockResolvedValue([
			'test_entry.yaml',
			'other_entry.yaml',
		] as unknown as Awaited<ReturnType<typeof readdir>>);

		vi.mocked(readYaml).mockResolvedValue({
			title: 'Test Entry',
		});

		const result = await loadEntryLocales(
			'/test/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.locale).toBe('default');
		expect(result[0]?.entry.title).toBe('Test Entry');
	});

	it('should load multiple locale files for an entry', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		// Justification: Test has exactly 3 locale files

		const expectedLocaleCount = 3;

		vi.mocked(readdir).mockResolvedValue([
			'test_entry.en-us.yaml',
			'test_entry.fr.yaml',
			'test_entry.de.yaml',
			'other_entry.yaml',
		] as unknown as Awaited<ReturnType<typeof readdir>>);

		vi.mocked(readYaml).mockImplementation(async (path: PathLike) => {
			const pathStr = String(path);
			if (pathStr.includes('en-us')) {
				return Promise.resolve({ locale: 'en-us', title: 'Test Entry' });
			}
			if (pathStr.includes('fr')) {
				return Promise.resolve({ locale: 'fr', title: 'Test Entry' });
			}
			if (pathStr.includes('de')) {
				return Promise.resolve({ locale: 'de', title: 'Test Entry' });
			}
			return Promise.resolve({});
		});

		const result = await loadEntryLocales(
			'/test/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result).toHaveLength(expectedLocaleCount);
		expect(result.map((r) => r.locale)).toEqual(['en-us', 'fr', 'de']);
	});

	it('should handle entries with dots in filename', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		// Justification: Test has exactly 2 locale files

		const expectedLocaleCount = 2;

		vi.mocked(readdir).mockResolvedValue([
			'Entry.With.Dots.en-us.yaml',
			'Entry.With.Dots.fr-ca.yaml',
		] as unknown as Awaited<ReturnType<typeof readdir>>);

		vi.mocked(readYaml).mockImplementation(async (path: PathLike) => {
			const pathStr = String(path);
			if (pathStr.includes('en-us')) {
				return Promise.resolve({
					locale: 'en-us',
					title: 'Entry.With.Dots',
				});
			}
			if (pathStr.includes('fr-ca')) {
				return Promise.resolve({
					locale: 'fr-ca',
					title: 'Entry.With.Dots',
				});
			}
			return Promise.resolve({});
		});

		const result = await loadEntryLocales(
			'/test/directory',
			'Entry.With.Dots',
			'Entry.With.Dots',
		);

		expect(result).toHaveLength(expectedLocaleCount);
		expect(result.map((r) => r.locale)).toEqual(['en-us', 'fr-ca']);
	});

	it('should set synthetic uid for filesystem entries', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		vi.mocked(readdir).mockResolvedValue([
			'test_entry.yaml',
		] as unknown as Awaited<ReturnType<typeof readdir>>);
		vi.mocked(readYaml).mockResolvedValue({ title: 'Test Entry' });

		const result = await loadEntryLocales(
			'/test/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result[0]?.entry.uid).toBe('file: Test Entry');
	});
});
