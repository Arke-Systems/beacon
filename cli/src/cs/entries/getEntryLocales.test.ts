import { describe, expect, it } from 'vitest';
import type { LocaleInfo } from './getEntryLocales.js';

describe('Entry Locale Serialization', () => {
	it('should parse locale info structure', () => {
		const localeInfo: LocaleInfo = {
			code: 'en-us',
			name: 'English - United States',
			uid: 'blt1234567890abcdef',
		};

		expect(localeInfo.code).toBe('en-us');
		expect(localeInfo.name).toBe('English - United States');
		expect(localeInfo.uid).toBe('blt1234567890abcdef');
	});

	it('should support locale info with fallback', () => {
		const localeInfo: LocaleInfo = {
			code: 'fr-ca',
			fallback_locale: 'en-us',
			name: 'French - Canada',
			uid: 'bltabcdef1234567890',
		};

		expect(localeInfo.fallback_locale).toBe('en-us');
	});

	it('should validate filename pattern for locale files', () => {
		const validFilenames = [
			'Entry Title.en-us.yaml',
			'Another Entry.es.yaml',
			'Complex Title (2).fr-ca.yaml',
		];

		const pattern = /^(?<title>.+)\.(?<locale>[^.]+)\.yaml$/u;

		for (const filename of validFilenames) {
			const match = pattern.exec(filename);
			expect(match).toBeTruthy();
			expect(match?.groups?.title).toBeTruthy();
			expect(match?.groups?.locale).toBeTruthy();
		}
	});

	it('should not match non-locale filenames', () => {
		const invalidFilenames = [
			'Entry Title.yaml', // no locale
			'Entry.Title.With.Many.Dots.yaml', // ambiguous
		];

		const pattern = /^(?<title>.+)\.(?<locale>[^.]+)\.yaml$/u;

		// These should still match the pattern, but the locale part
		// would need additional validation
		for (const filename of invalidFilenames) {
			const match = pattern.exec(filename);
			if (filename === 'Entry Title.yaml') {
				expect(match).toBeNull();
			} else {
				// Entry.Title.With.Many.Dots.yaml would match with
				// title="Entry.Title.With.Many" and locale="Dots"
				expect(match).toBeTruthy();
			}
		}
	});
});
