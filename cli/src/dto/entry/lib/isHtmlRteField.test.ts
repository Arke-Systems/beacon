import { describe, expect, it } from 'vitest';
import type { SchemaField } from '#cli/cs/Types.js';
import isHtmlRteField from './isHtmlRteField.js';

describe('isHtmlRteField', () => {
	it('returns true for HTML RTE field', () => {
		const field = {
			data_type: 'text' as const,
			display_name: 'Body Content',
			field_metadata: {
				allow_rich_text: true,
				rich_text_type: 'advanced',
			},
			uid: 'body_content',
		};

		expect(isHtmlRteField(field)).toBe(true);
	});

	it('returns false for JSON RTE field', () => {
		const field = {
			data_type: 'json' as const,
			display_name: 'Rich Text',
			field_metadata: {
				allow_json_rte: true,
			},
			uid: 'rich_text',
		};

		expect(isHtmlRteField(field)).toBe(false);
	});

	it('returns false for plain text field', () => {
		const field = {
			data_type: 'text' as const,
			display_name: 'Title',
			field_metadata: {},
			uid: 'title',
		};

		expect(isHtmlRteField(field)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isHtmlRteField(undefined)).toBe(false);
	});

	it('returns false when field_metadata is missing', () => {
		const field = {
			data_type: 'text' as const,
			display_name: 'Body',
			uid: 'body',
		};

		expect(isHtmlRteField(field as SchemaField | undefined)).toBe(false);
	});

	it('returns false when allow_rich_text is false', () => {
		const field = {
			data_type: 'text' as const,
			display_name: 'Body',
			field_metadata: {
				allow_rich_text: false,
			},
			uid: 'body',
		};

		expect(isHtmlRteField(field)).toBe(false);
	});
});
