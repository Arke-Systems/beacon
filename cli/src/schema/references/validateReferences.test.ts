import TestLogContext from '#test/integration/lib/TestLogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import type Ctx from '../ctx/Ctx.js';
import type { validateReferencesFromContext as ValidateReferencesFromContextType } from './validateReferences.js';

const logs = new TestLogContext();
const ui = new TestPushUiContext('fixtures', logs);
vi.doMock('../lib/SchemaUi.js', () => ({ default: () => ui }));

function createMockContentType(uid: string): ContentType {
	return {
		schema: [],
		title: uid,
		uid,
	} as unknown as ContentType;
}

function createMockEntry(uid: string, contentTypeUid: string): Entry {
	return {
		_content_type_uid: contentTypeUid,
		title: uid,
		uid,
	} as unknown as Entry;
}

function createMockCtx(
	contentTypeMap: Map<string, ContentType>,
	entriesMap: Map<string, Entry>,
	assetUids: Set<string>,
): Ctx {
	return {
		cs: {
			assets: {
				byUid: assetUids,
			},
			contentTypes: contentTypeMap,
			entries: {
				byTitleFor: (contentTypeUid: string) => {
					const entries = new Map<string, Entry>();
					for (const [typedUid, entry] of entriesMap) {
						if (typedUid.startsWith(`${contentTypeUid}/`)) {
							const title = typedUid.split('/')[1] ?? '';
							entries.set(title, entry);
						}
					}
					return entries;
				},
				byTypedUid: entriesMap,
			},
			globalFields: new Map(),
		},
	} as unknown as Ctx;
}

describe('validateReferences', () => {
	let validateReferencesFromContext: typeof ValidateReferencesFromContextType;

	beforeAll(async () => {
		const { validateReferencesFromContext: fn } =
			await import('./validateReferences.js');
		validateReferencesFromContext = fn;
	});

	it('should return empty report when all references are valid', () => {
		const contentTypeA = createMockContentType('content_type_a');
		const contentTypeB = createMockContentType('content_type_b');

		const entryA = createMockEntry('entry_a', 'content_type_a');
		const entryB = createMockEntry('entry_b', 'content_type_b');

		const contentTypes = new Map([
			['content_type_a', contentTypeA],
			['content_type_b', contentTypeB],
		]);
		const entries = new Map([
			['content_type_a/entry_a', entryA],
			['content_type_b/entry_b', entryB],
		]);
		const assets = new Set<string>(['asset_1', 'asset_2']);

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		const expectedTotalEntries = 2;
		expect(report.invalidReferences).toHaveLength(0);
		expect(report.totalEntriesChecked).toBe(expectedTotalEntries);
		expect(report.entriesWithIssues).toBe(0);
		expect(report.summary).toEqual({
			'invalid-structure': 0,
			'missing-asset': 0,
			'missing-content-type': 0,
			'missing-entry': 0,
		});
	});

	it('should detect missing referenced entries', () => {
		const contentTypeA = {
			schema: [
				{
					data_type: 'reference',
					display_name: 'Reference Field',
					uid: 'ref_field',
				},
			],
			title: 'content_type_a',
			uid: 'content_type_a',
		} as unknown as ContentType;

		const entryA = createMockEntry('entry_a', 'content_type_a');
		(entryA as Record<string, unknown>).ref_field = [
			{
				_content_type_uid: 'content_type_b',
				uid: 'missing_entry',
			},
		];

		const contentTypes = new Map([['content_type_a', contentTypeA]]);
		const entries = new Map([['content_type_a/entry_a', entryA]]);
		const assets = new Set<string>();

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		expect(report.invalidReferences).toHaveLength(1);
		expect(report.invalidReferences[0]).toMatchObject({
			fieldPath: 'ref_field',
			fromEntry: 'content_type_a/entry_a',
			issueType: 'missing-content-type',
			toContentTypeUid: 'content_type_b',
			toIdentifier: 'missing_entry',
		});
	});

	it('should detect missing content types', () => {
		const contentTypeA = {
			schema: [
				{
					data_type: 'reference',
					display_name: 'Reference Field',
					uid: 'ref_field',
				},
			],
			title: 'content_type_a',
			uid: 'content_type_a',
		} as unknown as ContentType;

		const entryA = createMockEntry('entry_a', 'content_type_a');
		(entryA as Record<string, unknown>).ref_field = [
			{
				_content_type_uid: 'nonexistent_type',
				uid: 'some_entry',
			},
		];

		const contentTypes = new Map([['content_type_a', contentTypeA]]);
		const entries = new Map([['content_type_a/entry_a', entryA]]);
		const assets = new Set<string>();

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		expect(report.invalidReferences).toHaveLength(1);
		expect(report.invalidReferences[0]).toMatchObject({
			issueType: 'missing-content-type',
			toContentTypeUid: 'nonexistent_type',
		});
	});

	it('should detect invalid reference structures', () => {
		const contentTypeA = {
			schema: [
				{
					data_type: 'reference',
					display_name: 'Reference Field',
					uid: 'ref_field',
				},
			],
			title: 'content_type_a',
			uid: 'content_type_a',
		} as unknown as ContentType;

		const entryA = createMockEntry('entry_a', 'content_type_a');
		(entryA as Record<string, unknown>).ref_field = 'not an array';

		const contentTypes = new Map([['content_type_a', contentTypeA]]);
		const entries = new Map([['content_type_a/entry_a', entryA]]);
		const assets = new Set<string>();

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		expect(report.invalidReferences).toHaveLength(1);
		expect(report.invalidReferences[0]).toMatchObject({
			issueType: 'invalid-structure',
		});
	});

	it('should detect missing assets in JSON RTE', () => {
		const contentTypeA = {
			schema: [
				{
					data_type: 'json',
					display_name: 'JSON RTE',
					uid: 'json_rte',
				},
			],
			title: 'content_type_a',
			uid: 'content_type_a',
		} as unknown as ContentType;

		const entryA = createMockEntry('entry_a', 'content_type_a');
		(entryA as Record<string, unknown>).json_rte = {
			children: [
				{
					attrs: {
						'asset-uid': 'missing_asset',
						'display-type': 'asset',
					},
					type: 'reference',
				},
			],
		};

		const contentTypes = new Map([['content_type_a', contentTypeA]]);
		const entries = new Map([['content_type_a/entry_a', entryA]]);
		const assets = new Set<string>();

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		expect(report.invalidReferences).toHaveLength(1);
		expect(report.invalidReferences[0]).toMatchObject({
			issueType: 'missing-asset',
			toContentTypeUid: 'sys_assets',
			toIdentifier: 'missing_asset',
		});
	});

	it('should handle multiple issues in a single entry', () => {
		const contentTypeA = {
			schema: [
				{
					data_type: 'reference',
					display_name: 'Reference Field',
					uid: 'ref_field',
				},
				{
					data_type: 'json',
					display_name: 'JSON RTE',
					uid: 'json_rte',
				},
			],
			title: 'content_type_a',
			uid: 'content_type_a',
		} as unknown as ContentType;

		const entryA = createMockEntry('entry_a', 'content_type_a');
		(entryA as Record<string, unknown>).ref_field = [
			{
				_content_type_uid: 'missing_type',
				uid: 'missing_entry',
			},
		];
		(entryA as Record<string, unknown>).json_rte = {
			children: [
				{
					attrs: {
						'asset-uid': 'missing_asset',
						'display-type': 'asset',
					},
					type: 'reference',
				},
			],
		};

		const contentTypes = new Map([['content_type_a', contentTypeA]]);
		const entries = new Map([['content_type_a/entry_a', entryA]]);
		const assets = new Set<string>();

		const ctx = createMockCtx(contentTypes, entries, assets);
		const report = validateReferencesFromContext(ctx);

		const expectedIssuesCount = 2;
		expect(report.invalidReferences).toHaveLength(expectedIssuesCount);
		expect(report.entriesWithIssues).toBe(1);
		expect(report.summary['missing-content-type']).toBe(1);
		expect(report.summary['missing-asset']).toBe(1);
	});
});
