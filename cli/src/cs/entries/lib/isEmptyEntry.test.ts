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
				ACL: {},
				_in_progress: true,
				_version: 1,
				created_at: '2025-03-03T19:38:14.402Z',
				created_by: 'another-uid-value',
				display_name: '',
				link: { href: '', title: '' },
				locale: 'en-us',
				logo: {},
				logo_url: '',
				tags: [],
				title: '',
				uid: 'some-uid-value',
				updated_at: '2025-03-03T19:38:14.402Z',
				updated_by: 'another-uid-value',
			},
			expected: true,
		},
		{
			description: 'returns false for populated entries',
			entry: {
				ACL: {},
				_in_progress: true,
				_version: 1,
				created_at: '2025-03-03T19:38:14.402Z',
				created_by: 'another-uid-value',
				display_name: 'some-display-name',
				link: { href: 'some-link-href', title: 'some-link-title' },
				locale: 'en-us',
				logo: {},
				logo_url: 'some-logo-url',
				tags: ['some-tag'],
				title: 'some-title',
				uid: 'some-uid-value',
				updated_at: '2025-03-03T19:38:14.402Z',
				updated_by: 'another-uid-value',
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
