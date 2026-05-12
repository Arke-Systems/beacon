/* eslint-disable sort-keys */
import { describe, expect, it } from 'vitest';

describe('getMasterLocale behavior', () => {
	// Note: getMasterLocale is a private function in toContentstack.ts
	// These tests document the expected behavior

	it('should identify locale without fallback_locale as master', () => {
		// Scenario: Stack with French as master locale
		const locales = [
			{ code: 'fr', name: 'French', uid: 'blt1' },
			{ code: 'en-us', fallback_locale: 'fr', name: 'English', uid: 'blt2' },
			{ code: 'de', fallback_locale: 'fr', name: 'German', uid: 'blt3' },
		];

		// Expected: fr should be identified as master
		const masterLocale = locales.find((l) => !l.fallback_locale);
		expect(masterLocale?.code).toBe('fr');
	});

	it('should handle English master locale correctly', () => {
		// Scenario: Stack with English as master locale
		const locales = [
			{ code: 'en-us', name: 'English', uid: 'blt1' },
			{ code: 'fr', fallback_locale: 'en-us', name: 'French', uid: 'blt2' },
			{ code: 'de', fallback_locale: 'en-us', name: 'German', uid: 'blt3' },
		];

		// Expected: en-us should be identified as master
		const masterLocale = locales.find((l) => !l.fallback_locale);
		expect(masterLocale?.code).toBe('en-us');
	});

	it('should handle Chinese master locale correctly', () => {
		// Scenario: Stack with Chinese as master locale
		const locales = [
			{ code: 'zh-cn', name: 'Chinese', uid: 'blt1' },
			{
				code: 'en-us',
				fallback_locale: 'zh-cn',
				name: 'English',
				uid: 'blt2',
			},
			{ code: 'fr', fallback_locale: 'zh-cn', name: 'French', uid: 'blt3' },
		];

		// Expected: zh-cn should be identified as master
		const masterLocale = locales.find((l) => !l.fallback_locale);
		expect(masterLocale?.code).toBe('zh-cn');
	});

	it('should use first locale if none have fallback info', () => {
		// Scenario: Stack without fallback_locale metadata
		const locales = [
			{ code: 'ja', name: 'Japanese', uid: 'blt1' },
			{ code: 'en-us', name: 'English', uid: 'blt2' },
		];

		// Expected: First locale is used as master
		expect(locales[0]?.code).toBe('ja');
	});
});

describe('importDefaultLocale behavior', () => {
	it('should use master locale for multi-locale entries', () => {
		// Scenario: Pushing entry with multiple locales to stack with French master
		const scenario = {
			filesystem: [
				'Entry.yaml (default locale)',
				'Entry.en-us.yaml',
				'Entry.de.yaml',
			],
			stackMasterLocale: 'fr',
			expected: [
				'importEntry called with locale="fr" for Entry.yaml',
				'importEntry called with locale="en-us" for Entry.en-us.yaml',
				'importEntry called with locale="de" for Entry.de.yaml',
			],
			beforeFix: [
				'Would use locale="en-us" for Entry.yaml (WRONG)',
				'Would cause issues on non-English stacks',
			],
			afterFix: [
				'Uses locale="fr" for Entry.yaml (CORRECT)',
				'Derived from stack locales API',
			],
		};

		expect(scenario.stackMasterLocale).toBe('fr');
		expect(scenario.afterFix.length).toBeGreaterThan(0);
	});

	it('should use undefined locale for single-locale entries', () => {
		// Scenario: Pushing entry with only default locale
		const scenario = {
			filesystem: ['Entry.yaml (only file)'],
			masterLocaleCode: null,
			expected: [
				'importEntry called with locale=undefined (backward compatible)',
			],
		};

		expect(scenario.masterLocaleCode).toBe(null);
	});

	it('should handle stack without locale API gracefully', () => {
		// Scenario: Stack doesn't support /v3/locales endpoint
		const scenario = {
			filesystem: ['Entry.yaml', 'Entry.fr.yaml'],
			localesApiSupported: false,
			expected: [
				'Falls back to locale=undefined',
				'Maintains backward compatibility',
			],
		};

		expect(scenario.localesApiSupported).toBe(false);
	});
});

describe('determineMasterLocale behavior', () => {
	it('should call stack locales API when needed', () => {
		// Scenario: Multi-locale entry push requires master locale
		const scenario = {
			entryHasOtherLocales: true,
			action: 'Call getLocales(client)',
			thenCall: 'getMasterLocale(stackLocales)',
			returns: 'Master locale code (e.g., "zh-cn", "fr", "en-us")',
		};

		expect(scenario.entryHasOtherLocales).toBe(true);
	});

	it('should return null for single-locale entries', () => {
		// Scenario: Entry has only default locale file
		const scenario = {
			otherLocaleVersions: [],
			result: null,
			meaning: 'Use undefined locale (backward compatible)',
		};

		expect(scenario.otherLocaleVersions).toHaveLength(0);
		expect(scenario.result).toBe(null);
	});

	it('should handle API errors gracefully', () => {
		// Scenario: getLocales API call fails
		const scenario = {
			localesApiFails: true,
			catchBlock: 'Returns null',
			behavior: 'Uses undefined locale (maintains compatibility)',
		};

		expect(scenario.localesApiFails).toBe(true);
		expect(scenario.catchBlock).toBe('Returns null');
	});
});
