/* eslint-disable sort-keys */
import { describe, it, expect } from 'vitest';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import BeaconReplacer from '../../BeaconReplacer.js';
import type MinimalCtx from '../../lib/MinimalCtx.js';

const EXPECTED_MATCH_COUNT = 2;

describe('processHtmlRteAsset - Entry References', () => {
	const mockContentType: ContentType = {
		schema: [],
		title: 'Test Content Type',
		uid: 'test_content_type',
	};

	const mockCtx = {
		cs: {
			assets: {
				byParentUid: new Map(),
			},
		},
		fs: {
			assets: {
				assetsByPath: new Map(),
			},
		},
		references: {
			findReferencedUid: (fromPath: ReferencePath, toPath: ReferencePath) => {
				// Mock implementation: return a mock UID based on the target path
				if (toPath === 'page_article_page/Test Entry') {
					return 'bltentry123456';
				}
				if (toPath === 'page_application_category/Wireless') {
					return 'bltentry789012';
				}
				if (
					toPath === 'page_article_page/How Carrier Networks Will Enable 5G'
				) {
					return 'bltentry345678';
				}
				throw new Error(`Unknown reference: ${toPath}`);
			},
		},
	};

	it('should handle entry references in href attributes', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);
		(replacer as BeaconReplacer & { refPath: string }).refPath =
			'test_content_type/Source Entry';

		const input =
			'<a href="$beacon: page_article_page/Test Entry">Click here</a>';
		const result = (
			replacer as BeaconReplacer & {
				processHtmlRteAsset: (input: string) => string;
			}
		).processHtmlRteAsset(input);

		expect(result).toContain('data-sys-entry-uid="bltentry123456"');
		expect(result).toContain('data-sys-content-type-uid="page_article_page"');
		expect(result).toContain('data-sys-entry-locale="en-us"');
		expect(result).toContain('sys-style-type="link"');
		expect(result).toContain('type="entry"');
		expect(result).toContain('class="embedded-entry"');
		expect(result).toContain('Click here');
	});

	it('should handle multiple entry references', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);
		(replacer as BeaconReplacer & { refPath: string }).refPath =
			'test_content_type/Source Entry';

		const input =
			'<a href="$beacon: page_article_page/Test Entry">First</a> and <a href="$beacon: page_application_category/Wireless">Second</a>';
		const result = (
			replacer as BeaconReplacer & {
				processHtmlRteAsset: (input: string) => string;
			}
		).processHtmlRteAsset(input);

		expect(result).toContain('data-sys-entry-uid="bltentry123456"');
		expect(result).toContain('data-sys-entry-uid="bltentry789012"');
		expect(result).toContain('data-sys-content-type-uid="page_article_page"');
		expect(result).toContain(
			'data-sys-content-type-uid="page_application_category"',
		);
		expect(result.match(/data-sys-entry-locale="en-us"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);
		expect(result.match(/sys-style-type="link"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);
		expect(result.match(/type="entry"/gu)).toHaveLength(EXPECTED_MATCH_COUNT);
	});

	it('should leave regular href attributes unchanged', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);
		(replacer as BeaconReplacer & { refPath: string }).refPath =
			'test_content_type/Test Entry';

		const input = '<a href="https://example.com">External Link</a>';
		const result = (
			replacer as BeaconReplacer & {
				processHtmlRteAsset: (input: string) => string;
			}
		).processHtmlRteAsset(input);

		expect(result).toBe(input);
	});

	it('should handle complex HTML with entry references', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);
		(replacer as BeaconReplacer & { refPath: string }).refPath =
			'test_content_type/Source Entry';

		const input = `<p>Visit our <a href="$beacon: page_article_page/Test Entry">product page</a> for more info.</p>
<p><a href="https://external.com">External</a></p>`;
		const result = (
			replacer as BeaconReplacer & {
				processHtmlRteAsset: (input: string) => string;
			}
		).processHtmlRteAsset(input);

		expect(result).toContain('data-sys-entry-uid="bltentry123456"');
		expect(result).toContain('href="https://external.com"');
		expect(result).toContain('product page');
		expect(result).toContain('External</a>');
	});

	it('should handle real-world example from migration', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);
		(replacer as BeaconReplacer & { refPath: string }).refPath =
			'page_article_page/5G in 60: 5G Base Station Rollout';

		const input =
			'<a href="$beacon: page_application_category/Wireless">Millimeter wave</a>. <a href="$beacon: page_article_page/How Carrier Networks Will Enable 5G">Beamforming</a>.';
		const result = (
			replacer as BeaconReplacer & {
				processHtmlRteAsset: (input: string) => string;
			}
		).processHtmlRteAsset(input);

		// First entry reference
		expect(result).toContain('data-sys-entry-uid="bltentry789012"');
		expect(result).toContain(
			'data-sys-content-type-uid="page_application_category"',
		);

		// Second entry reference
		expect(result).toContain('data-sys-entry-uid="bltentry345678"');
		expect(result).toContain('data-sys-content-type-uid="page_article_page"');

		// Both should have required attributes
		expect(result.match(/data-sys-entry-locale="en-us"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);
		expect(result.match(/sys-style-type="link"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);
		expect(result.match(/type="entry"/gu)).toHaveLength(EXPECTED_MATCH_COUNT);
		expect(result.match(/class="embedded-entry"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);

		// Original text should be preserved
		expect(result).toContain('Millimeter wave');
		expect(result).toContain('Beamforming');
	});

	it('should use custom locale when set via process method', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);

		const entry = {
			title: 'Source Entry',
			uid: 'blttest123',
			description: '<a href="$beacon: page_article_page/Test Entry">Link</a>',
		};

		// Process with fr-fr locale
		const result = replacer.process(entry, 'fr-fr');

		expect(result.description).toContain('data-sys-entry-locale="fr-fr"');
		expect(result.description).not.toContain('data-sys-entry-locale="en-us"');
	});

	it('should use different locales for different entries', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);

		const entry = {
			title: 'Source Entry',
			uid: 'blttest123',
			description: '<a href="$beacon: page_article_page/Test Entry">Link</a>',
		};

		// Process with de-de locale
		const resultDe = replacer.process(entry, 'de-de');
		expect(resultDe.description).toContain('data-sys-entry-locale="de-de"');

		// Process with es-es locale
		const resultEs = replacer.process(entry, 'es-es');
		expect(resultEs.description).toContain('data-sys-entry-locale="es-es"');

		// Process without locale (should use default)
		const resultDefault = replacer.process(entry);
		expect(resultDefault.description).toContain(
			'data-sys-entry-locale="en-us"',
		);
	});

	it('should handle multiple entry references with custom locale', () => {
		const replacer = new BeaconReplacer(
			mockCtx as unknown as MinimalCtx,
			mockContentType,
		);

		const entry = {
			title: 'Source Entry',
			uid: 'blttest123',
			description:
				'<a href="$beacon: page_article_page/Test Entry">First</a> and <a href="$beacon: page_application_category/Wireless">Second</a>',
		};

		// Process with ja-jp locale
		const result = replacer.process(entry, 'ja-jp');

		// Both references should use the same locale
		const description = result.description as string;
		expect(description.match(/data-sys-entry-locale="ja-jp"/gu)).toHaveLength(
			EXPECTED_MATCH_COUNT,
		);
		expect(description).not.toContain('data-sys-entry-locale="en-us"');
	});
});
