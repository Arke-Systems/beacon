import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import { describe, expect, it } from 'vitest';
import HtmlRteReplacer from './HtmlRteReplacer.js';

describe('HtmlRteReplacer', () => {
	const mockAsset: RawAssetItem = {
		ACL: [],
		_version: 1,
		content_type: 'image/jpeg',
		created_at: '2024-01-01T00:00:00.000Z',
		created_by: 'blttest',
		file_size: '12345',
		filename: 'test-image.jpg',
		is_dir: false,
		parent_uid: null,
		tags: [],
		title: 'Test Image',
		uid: 'blt9ea3051c5cc7915b',
		updated_at: '2024-01-01T00:00:00.000Z',
		updated_by: 'blttest',
		url: 'https://images.contentstack.io/v3/assets/blttest/blt9ea3051c5cc7915b/test-image.jpg',
	};

	const mockAssetsByUid = new Map<string, RawAssetItem>([
		['blt9ea3051c5cc7915b', mockAsset],
	]);

	const mockCtx = {
		cs: {
			assets: {
				byParentUid: new Map(),
				byUid: mockAssetsByUid,
			},
		},
	} as unknown as Ctx;

	const refPath = 'page_customer_success_story/Test Entry' as const;

	const htmlRteField: SchemaField = {
		data_type: 'text',
		display_name: 'Body Content',
		field_metadata: {
			allow_rich_text: true,
			rich_text_type: 'advanced',
		},
		uid: 'body_content',
	};

	it('replaces img tags with asset_uid attributes', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		const input =
			'<p>Text before</p><img asset_uid="blt9ea3051c5cc7915b" src="https://images.contentstack.io/v3/assets/bltf85b31277a3c4808/blt9ea3051c5cc7915b/697b9310f85b3477236fd804/test-image.jpg" alt="test" /><p>Text after</p>';

		const result = replacer.process(htmlRteField, input);

		expect(result).toContain("{asset: $beacon: 'test-image.jpg'}");
		expect(result).not.toContain('asset_uid=');
		expect(result).not.toContain('contentstack.io');
	});

	it('replaces img tags with only src attributes containing contentstack URLs', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		const input =
			'<p>Text</p><img src="https://images.contentstack.io/v3/assets/bltf85b31277a3c4808/blt9ea3051c5cc7915b/697b9310f85b3477236fd804/test-image.jpg" alt="test" />';

		const result = replacer.process(htmlRteField, input);

		expect(result).toContain("{asset: $beacon: 'test-image.jpg'}");
		expect(result).not.toContain('contentstack.io');
	});

	it('preserves other attributes on img tags', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		const input =
			'<img asset_uid="blt9ea3051c5cc7915b" src="https://images.contentstack.io/v3/assets/bltf85b31277a3c4808/blt9ea3051c5cc7915b/697b9310f85b3477236fd804/test-image.jpg" alt="test image" height="auto" class="featured" />';

		const result = replacer.process(htmlRteField, input);

		expect(result).toContain('alt="test image"');
		expect(result).toContain('height="auto"');
		expect(result).toContain('class="featured"');
	});

	it('does not process non-HTML RTE fields', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		const textField: SchemaField = {
			data_type: 'text',
			display_name: 'Title',
			field_metadata: {},
			uid: 'title',
		};

		const input = '<img asset_uid="blt9ea3051c5cc7915b" />';
		const result = replacer.process(textField, input);

		expect(result).toBe(input);
	});

	it('does not process non-string values', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		expect(replacer.process(htmlRteField, null)).toBe(null);
		expect(replacer.process(htmlRteField, undefined)).toBe(undefined);
		const testNumber = 123;
		expect(replacer.process(htmlRteField, testNumber)).toBe(testNumber);
	});

	it('handles multiple img tags in the same HTML', () => {
		const replacer = new HtmlRteReplacer(mockCtx, refPath);

		const input =
			'<p>First image:</p><img asset_uid="blt9ea3051c5cc7915b" src="https://images.contentstack.io/v3/assets/bltf85b31277a3c4808/blt9ea3051c5cc7915b/697b9310f85b3477236fd804/test-image.jpg" /><p>Second image:</p><img src="https://images.contentstack.io/v3/assets/bltf85b31277a3c4808/blt9ea3051c5cc7915b/697b9310f85b3477236fd804/test-image.jpg" />';

		const result = replacer.process(htmlRteField, input);

		const matches = (result as string).match(/\{asset: \$beacon:/gu);
		const expectedMatches = 2;
		expect(matches).toHaveLength(expectedMatches);
	});
});
