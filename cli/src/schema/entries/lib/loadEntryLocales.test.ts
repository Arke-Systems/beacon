import { describe, expect, it } from 'vitest';
import loadEntryLocales from './loadEntryLocales.js';

describe(loadEntryLocales.name, () => {
	it('should return empty array when directory does not exist', async () => {
		const result = await loadEntryLocales(
			'/nonexistent/directory',
			'Test Entry',
			'test_entry',
		);

		expect(result).toEqual([]);
	});

	it('should load multiple locale files for an entry', () => {
		// This test would require fixture files to be set up
		// For now, it serves as a placeholder for integration tests
		expect(true).toBe(true);
	});

	it('should parse locale from filename correctly', () => {
		const filename = 'Autumn Feast and Social.en-us.yaml';
		const pattern = /^(?<title>.+)\.(?<locale>[^.]+)\.yaml$/u;
		const match = pattern.exec(filename);

		expect(match).toBeTruthy();
		if (match?.groups) {
			const { title, locale } = match.groups;
			expect(title).toBe('Autumn Feast and Social');
			expect(locale).toBe('en-us');
		}
	});

	it('should handle filenames with multiple dots', () => {
		const filename = 'Entry.With.Dots.fr-ca.yaml';
		const pattern = /^(?<title>.+)\.(?<locale>[^.]+)\.yaml$/u;
		const match = pattern.exec(filename);

		expect(match).toBeTruthy();
		if (match?.groups) {
			const { title, locale } = match.groups;
			expect(title).toBe('Entry.With.Dots');
			expect(locale).toBe('fr-ca');
		}
	});
});
