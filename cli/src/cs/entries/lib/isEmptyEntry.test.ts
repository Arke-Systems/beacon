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
				title: '',
				display_name: '',
				logo: {},
				logo_url: '',
				link: { title: '', href: '' },
				tags: [],
				locale: 'en-us',
				uid: 'some-uid-value',
				created_by: 'another-uid-value',
				updated_by: 'another-uid-value',
				created_at: '2025-03-03T19:38:14.402Z',
				updated_at: '2025-03-03T19:38:14.402Z',
				ACL: {},
				_version: 1,
				_in_progress: true,
			},
			expected: true,
		},
		{
			description: 'returns false for populated entries',
			entry: {
				title: 'some-title',
				display_name: 'some-display-name',
				logo: {},
				logo_url: 'some-logo-url',
				link: { title: 'some-link-title', href: 'some-link-href' },
				tags: ['some-tag'],
				locale: 'en-us',
				uid: 'some-uid-value',
				created_by: 'another-uid-value',
				updated_by: 'another-uid-value',
				created_at: '2025-03-03T19:38:14.402Z',
				updated_at: '2025-03-03T19:38:14.402Z',
				ACL: {},
				_version: 1,
				_in_progress: true,
			},
			expected: false,
		},
	];

	theories.forEach(({ description, entry, expected }) => {
		it(description, () => {
			// Act
			const result = Store.run(ui, () => isEmptyEntry('contentTypeUid', entry));

			// Assert
			expect(result).toBe(expected);
		});
	});
});
