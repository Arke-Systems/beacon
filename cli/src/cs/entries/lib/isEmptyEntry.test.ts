import type { ContentType } from '#cli/cs/content-types/Types.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import TestLogContext from '#test/integration/lib/TestLogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import { describe, expect, it } from 'vitest';
import type { Entry } from '../Types.js';
import isEmptyEntry from './isEmptyEntry.js';

const logs = new TestLogContext();
const ui = new TestPushUiContext('', logs);

describe(isEmptyEntry.name, () => {
	interface Theory {
		readonly description: string;
		readonly entry: Entry;
		readonly expected: boolean;
	}

	const theories: Theory[] = [
		{
			description: 'returns true for empty entries',
			entry: {
				...mockEntry(),
				display_name: '',
				link: { href: '', title: '' },
				logo: {},
				logo_url: '',
			},
			expected: true,
		},
		{
			description: 'returns false for populated entries',
			entry: {
				...mockEntry(),
				display_name: 'some-display-name',
				link: { href: 'some-link-href', title: 'some-link-title' },
				logo: {},
				logo_url: 'some-logo-url',
				tags: ['some-tag'],
				title: 'some-title',
			},
			expected: false,
		},
		{
			description: 'returns true for entries containing empty RTE fields',
			entry: {
				...mockEntry(),
				description: {
					type: 'doc',
					attrs: {},
					uid: '07cc2e39fcc94427ae255b8e5f32fce2',
					children: [
						{
							type: 'p',
							attrs: {},
							uid: '87e76bf2af8d49d2b69a0b63cf83f96a',
							children: [{ text: '' }],
						},
					],
					_version: 1,
				},
			},
			expected: true,
		},
		{
			description: 'returns false for entries containing populated RTE fields',
			entry: {
				...mockEntry(),
				description: {
					type: 'doc',
					attrs: {},
					uid: '07cc2e39fcc94427ae255b8e5f32fce2',
					children: [
						{
							type: 'p',
							attrs: {},
							uid: '87e76bf2af8d49d2b69a0b63cf83f96a',
							children: [{ text: 'some text goes here' }],
						},
					],
					_version: 1,
				},
			},
			expected: false,
		},
	];

	theories.forEach(({ description, entry, expected }) => {
		it(description, () => {
			// Arrange
			const contentType: ContentType = {
				schema: [],
				title: 'some-title',
				uid: 'contentTypeUid',
			};

			// Act
			const result = Store.run(ui, () => isEmptyEntry(contentType, entry));

			// Assert
			expect(result).toBe(expected);
		});
	});
});

function mockEntry() {
	const now = new Date();

	return {
		ACL: {},
		_in_progress: true,
		_version: 1,
		created_at: now.toISOString(),
		created_by: 'another-uid-value',
		locale: 'en-us',
		tags: [],
		title: '',
		uid: 'some-uid-value',
		updated_at: now.toISOString(),
		updated_by: 'another-uid-value',
	};
}
