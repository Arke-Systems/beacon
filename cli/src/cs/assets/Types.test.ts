import { describe, expect, it } from 'vitest';
import { isRawAsset } from './Types.js';

describe('isRawAsset', () => {
	it('can validate a RawAsset', () => {
		// Arrange
		const fixture = {
			ACL: {},
			_version: 1,
			content_type: 'image/webp',
			created_at: '2024-10-07T14:48:31.160Z',
			created_by: 'blte1f9f862a5105eca',
			file_size: '71498',
			filename: 'Mariel.webp',
			is_dir: false,
			parent_uid: null,
			tags: [],
			title: 'Mariel.webp',
			uid: 'blte7604d9ccee2b73b',
			updated_at: '2024-10-07T14:48:31.160Z',
			updated_by: 'blte1f9f862a5105eca',
			url: 'https://images.contentstack.io/etc/etc/etc/Mariel.webp',
		};

		// Act
		const result = isRawAsset(fixture);

		// Assert
		expect(result).toBe(true);
	});
});
