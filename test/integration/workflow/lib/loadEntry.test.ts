import { describe, expect, it } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import loadEntry from './loadEntry.js';

describe('loadEntry', () => {
	it('loads simple format file', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			await writeFile(
				resolve(entriesDir, 'Test Entry.yaml'),
				'title: Test Entry\nuid: blttest123\n',
			);

			const result = await loadEntry(
				testDir,
				'test_content_type',
				'Test Entry',
			);

			expect(result).toEqual({
				title: 'Test Entry',
				uid: 'blttest123',
			});
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('loads locale-specific file when simple format does not exist', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			await writeFile(
				resolve(entriesDir, 'Test Entry.fr-fr.yaml'),
				'title: Test Entry\nuid: blttest123\n',
			);

			const result = await loadEntry(
				testDir,
				'test_content_type',
				'Test Entry',
			);

			expect(result).toEqual({
				title: 'Test Entry',
				uid: 'blttest123',
			});
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('throws YAML parse error immediately without falling back', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			// Create a simple format file with invalid YAML
			await writeFile(
				resolve(entriesDir, 'Test Entry.yaml'),
				'title: Test Entry\n  invalid: indentation\nuid: blttest123\n',
			);
			// Also create a valid locale-specific file that should NOT be loaded
			await writeFile(
				resolve(entriesDir, 'Test Entry.fr-fr.yaml'),
				'title: Valid Entry\nuid: bltvalid123\n',
			);

			// Should throw the YAML parse error, not fall back to the locale file
			await expect(
				loadEntry(testDir, 'test_content_type', 'Test Entry'),
			).rejects.toThrow();
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('throws error when neither simple nor locale-specific file exists', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });

			await expect(
				loadEntry(testDir, 'test_content_type', 'Nonexistent Entry'),
			).rejects.toThrow();
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('prefers simple format over locale-specific when both exist', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			await writeFile(
				resolve(entriesDir, 'Test Entry.yaml'),
				'title: Simple Format\nuid: bltsimple123\n',
			);
			await writeFile(
				resolve(entriesDir, 'Test Entry.fr-fr.yaml'),
				'title: Locale Format\nuid: bltlocale123\n',
			);

			const result = await loadEntry(
				testDir,
				'test_content_type',
				'Test Entry',
			);

			expect(result).toEqual({
				title: 'Simple Format',
				uid: 'bltsimple123',
			});
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('handles entry names with special regex characters', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			const entryName = 'Test (Entry) [With] Special.Characters';
			await writeFile(
				resolve(entriesDir, `${entryName}.de-de.yaml`),
				'title: Special Entry\nuid: bltspecial123\n',
			);

			const result = await loadEntry(testDir, 'test_content_type', entryName);

			expect(result).toEqual({
				title: 'Special Entry',
				uid: 'bltspecial123',
			});
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});

	it('validates locale codes in filenames', async () => {
		const testDir = resolve(tmpdir(), `loadEntry-test-${Date.now()}`);
		const entriesDir = resolve(testDir, 'entries', 'test_content_type');

		try {
			await mkdir(entriesDir, { recursive: true });
			// Create files with invalid locale codes (should not be matched)
			await writeFile(
				resolve(entriesDir, 'Test Entry.notlocale.yaml'),
				'title: Not Locale\nuid: bltnotlocale123\n',
			);
			await writeFile(
				resolve(entriesDir, 'Test Entry.123.yaml'),
				'title: Numeric\nuid: bltnumeric123\n',
			);
			// Create file with valid locale code
			await writeFile(
				resolve(entriesDir, 'Test Entry.en-gb.yaml'),
				'title: Valid Locale\nuid: bltvalid123\n',
			);

			const result = await loadEntry(
				testDir,
				'test_content_type',
				'Test Entry',
			);

			// Should load the valid locale file
			expect(result).toEqual({
				title: 'Valid Locale',
				uid: 'bltvalid123',
			});
		} finally {
			await rm(testDir, { force: true, recursive: true });
		}
	});
});
