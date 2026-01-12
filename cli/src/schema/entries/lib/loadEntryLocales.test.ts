import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entry } from '#cli/cs/entries/Types.js';
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
		] as any);

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

		vi.mocked(readdir).mockResolvedValue([
			'test_entry.en-us.yaml',
			'test_entry.fr.yaml',
			'test_entry.de.yaml',
			'other_entry.yaml',
		] as any);

		vi.mocked(readYaml).mockImplementation(async (path: any) => {
			if (path.includes('en-us')) {
				return { locale: 'en-us', title: 'Test Entry' };
			}
			if (path.includes('fr')) {
				return { locale: 'fr', title: 'Test Entry' };
			}
			if (path.includes('de')) {
				return { locale: 'de', title: 'Test Entry' };
			}
			return {};
		});

		const result = await loadEntryLocales(
			'/test/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result).toHaveLength(3);
		expect(result.map((r) => r.locale)).toEqual(['en-us', 'fr', 'de']);
	});

	it('should handle entries with dots in filename', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		vi.mocked(readdir).mockResolvedValue([
			'Entry.With.Dots.en-us.yaml',
			'Entry.With.Dots.fr-ca.yaml',
		] as any);

		vi.mocked(readYaml).mockImplementation(async (path: any) => {
			if (path.includes('en-us')) {
				return { locale: 'en-us', title: 'Entry.With.Dots' };
			}
			if (path.includes('fr-ca')) {
				return { locale: 'fr-ca', title: 'Entry.With.Dots' };
			}
			return {};
		});

		const result = await loadEntryLocales(
			'/test/directory',
			'Entry.With.Dots',
			'Entry.With.Dots',
		);

		expect(result).toHaveLength(2);
		expect(result.map((r) => r.locale)).toEqual(['en-us', 'fr-ca']);
	});

	it('should set synthetic uid for filesystem entries', async () => {
		const { readdir } = await import('node:fs/promises');
		const readYaml = (await import('#cli/fs/readYaml.js')).default;

		vi.mocked(readdir).mockResolvedValue(['test_entry.yaml'] as any);
		vi.mocked(readYaml).mockResolvedValue({ title: 'Test Entry' });

		const result = await loadEntryLocales(
			'/test/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result[0]?.entry.uid).toBe('file: Test Entry');
	});
});
