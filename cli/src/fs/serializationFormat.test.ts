import { describe, expect, it } from 'vitest';
import {
	getFileExtension,
	getSupportedExtensions,
	detectFormat,
	getLocaleFilePattern,
} from './serializationFormat.js';

describe('serializationFormat', () => {
	describe(getFileExtension.name, () => {
		it('returns .yaml for yaml format', () => {
			expect(getFileExtension('yaml')).toBe('.yaml');
		});

		it('returns .json for json format', () => {
			expect(getFileExtension('json')).toBe('.json');
		});
	});

	describe(getSupportedExtensions.name, () => {
		it('returns array of supported extensions', () => {
			const extensions = getSupportedExtensions();
			expect(extensions).toContain('.yaml');
			expect(extensions).toContain('.yml');
			expect(extensions).toContain('.json');
		});
	});

	describe(detectFormat.name, () => {
		it('detects json format from .json extension', () => {
			expect(detectFormat('file.json')).toBe('json');
			expect(detectFormat('/path/to/file.json')).toBe('json');
		});

		it('detects yaml format from .yaml extension', () => {
			expect(detectFormat('file.yaml')).toBe('yaml');
			expect(detectFormat('/path/to/file.yaml')).toBe('yaml');
		});

		it('defaults to yaml for unknown extensions', () => {
			expect(detectFormat('file.txt')).toBe('yaml');
			expect(detectFormat('file')).toBe('yaml');
		});
	});

	describe(getLocaleFilePattern.name, () => {
		it('creates pattern for yaml files', () => {
			const pattern = getLocaleFilePattern('Entry_Title', 'yaml');
			expect(pattern.test('Entry_Title.en-us.yaml')).toBe(true);
			expect(pattern.test('Entry_Title.fr.yaml')).toBe(true);
			expect(pattern.test('Entry_Title.yaml')).toBe(false);
			expect(pattern.test('Entry_Title.en-us.json')).toBe(false);
		});

		it('creates pattern for json files', () => {
			const pattern = getLocaleFilePattern('Entry_Title', 'json');
			expect(pattern.test('Entry_Title.en-us.json')).toBe(true);
			expect(pattern.test('Entry_Title.fr.json')).toBe(true);
			expect(pattern.test('Entry_Title.json')).toBe(false);
			expect(pattern.test('Entry_Title.en-us.yaml')).toBe(false);
		});

		it('escapes special regex characters in filename', () => {
			const pattern = getLocaleFilePattern('Entry.Title (1)', 'yaml');
			expect(pattern.test('Entry.Title (1).en-us.yaml')).toBe(true);
			expect(pattern.test('EntryxTitle_x1x.en-us.yaml')).toBe(false);
		});
	});
});
