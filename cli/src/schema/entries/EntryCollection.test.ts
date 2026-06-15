/* eslint-disable sort-keys */
import { describe, expect, it, vi } from 'vitest';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import type UiContext from '#cli/ui/UiContext.js';
import EntryCollection from './EntryCollection.js';

describe('EntryCollection', () => {
	const mockContentType: ContentType = {
		uid: 'test_content_type',
		title: 'Test Content Type',
		schema: [],
	};

	function createEntry(uid: string, title: string): Entry {
		return {
			uid,
			title,
			created_by: 'test',
			updated_by: 'test',
			created_at: '2024-01-01T00:00:00.000Z',
			updated_at: '2024-01-01T00:00:00.000Z',
			_version: 1,
			tags: [],
			locale: 'en-us',
			ACL: {},
		};
	}

	it('indexes entries by typed uid', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const entry1 = createEntry('blt123', 'Entry One');
		const entry2 = createEntry('blt456', 'Entry Two');

		const entries = new Map([[mockContentType, new Set([entry1, entry2])]]);

		const collection = Store.run(mockUi, () => new EntryCollection(entries));

		expect(collection.byTypedUid.get('test_content_type/blt123')).toBe(entry1);
		expect(collection.byTypedUid.get('test_content_type/blt456')).toBe(entry2);
	});

	it('indexes entries by title within content type', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const entry1 = createEntry('blt123', 'Entry One');
		const entry2 = createEntry('blt456', 'Entry Two');

		const entries = new Map([[mockContentType, new Set([entry1, entry2])]]);

		const collection = Store.run(mockUi, () => new EntryCollection(entries));

		const byTitle = collection.byTitleFor('test_content_type');
		expect(byTitle.get('Entry One')).toBe(entry1);
		expect(byTitle.get('Entry Two')).toBe(entry2);
	});

	it('warns about duplicate titles via ui.warn', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const entry1 = createEntry('blt123', 'Duplicate Title');
		const entry2 = createEntry('blt456', 'Duplicate Title');
		const entry3 = createEntry('blt789', 'Duplicate Title');

		const entries = new Map([
			[mockContentType, new Set([entry1, entry2, entry3])],
		]);

		const collection = Store.run(mockUi, () => new EntryCollection(entries));

		// Should have called ui.warn for the duplicate
		expect(mockUi.warn).toHaveBeenCalled();

		// Check that warnings mention the duplicate title and UIDs
		const { calls } = (mockUi.warn as ReturnType<typeof vi.fn>).mock;
		const warningText = calls.flat().join(' ');
		expect(warningText).toContain('Multiple entries');
		expect(warningText).toContain('Duplicate Title');
		expect(warningText).toContain('blt123');
		expect(warningText).toContain('blt456');
		expect(warningText).toContain('blt789');

		// Should keep the last entry for title matching
		const byTitle = collection.byTitleFor('test_content_type');
		expect(byTitle.get('Duplicate Title')).toBe(entry3);
	});

	it('does not warn when all titles are unique', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const entry1 = createEntry('blt123', 'Entry One');
		const entry2 = createEntry('blt456', 'Entry Two');
		const entry3 = createEntry('blt789', 'Entry Three');

		const entries = new Map([
			[mockContentType, new Set([entry1, entry2, entry3])],
		]);

		Store.run(mockUi, () => new EntryCollection(entries));

		// Should not have called ui.warn
		expect(mockUi.warn).not.toHaveBeenCalled();
	});

	it('handles entries from multiple content types', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const contentType1: ContentType = {
			uid: 'type_one',
			title: 'Type One',
			schema: [],
		};
		const contentType2: ContentType = {
			uid: 'type_two',
			title: 'Type Two',
			schema: [],
		};

		const entry1 = createEntry('blt123', 'Entry One');
		const entry2 = createEntry('blt456', 'Entry Two');

		const entries = new Map([
			[contentType1, new Set([entry1])],
			[contentType2, new Set([entry2])],
		]);

		const collection = Store.run(mockUi, () => new EntryCollection(entries));

		expect(collection.byTitleFor('type_one').get('Entry One')).toBe(entry1);
		expect(collection.byTitleFor('type_two').get('Entry Two')).toBe(entry2);
	});

	it('allows updating entries via set method', () => {
		const mockUi = {
			warn: vi.fn(),
		} as unknown as UiContext;

		const entry1 = createEntry('blt123', 'Original Title');

		const entries = new Map([[mockContentType, new Set([entry1])]]);

		const collection = Store.run(mockUi, () => new EntryCollection(entries));

		// Update the entry with a new title
		const updatedEntry = { ...entry1, title: 'Updated Title' };
		collection.set('test_content_type', updatedEntry);

		// Should be accessible by new title
		const byTitle = collection.byTitleFor('test_content_type');
		expect(byTitle.get('Updated Title')).toBe(updatedEntry);
		expect(byTitle.get('Original Title')).toBeUndefined();
	});
});
