import type Client from '#cli/cs/api/Client.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import type UiContext from '#cli/ui/UiContext.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import clear from './clear.js';

vi.mock('#cli/cs/content-types/index.js');
vi.mock('#cli/cs/content-types/delete.js');
vi.mock('#cli/cs/entries/index.js');
vi.mock('#cli/cs/entries/indexEntriesForLocale.js');
vi.mock('#cli/cs/entries/delete.js');
vi.mock('#cli/cs/global-fields/index.js');
vi.mock('#cli/cs/global-fields/delete.js');
vi.mock('#cli/cs/locales/getLocales.js');
vi.mock('#cli/cs/taxonomies/index.js');
vi.mock('#cli/cs/taxonomies/delete.js');
vi.mock('#cli/cs/assets/index.js');
vi.mock('#cli/cs/assets/delete.js');
vi.mock('#cli/cs/assets/deleteFolder.js');

describe('clear', () => {
	let mockClient: Client;
	let mockUi: UiContext;

	beforeEach(() => {
		vi.clearAllMocks();
		mockClient = {} as Client;
		mockUi = {
			createProgressBar: vi.fn().mockReturnValue({
				increment: vi.fn(),
				update: vi.fn(),
				[Symbol.dispose]: vi.fn(),
			}),
			info: vi.fn(),
			options: {
				schema: {
					assets: {
						isIncluded: vi.fn().mockReturnValue(true),
					},
				},
			},
			warn: vi.fn(),
		} as unknown as UiContext;
	});

	describe('when no content types specified', () => {
		it('should delete all content types, global fields, taxonomies, and assets', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const indexTaxonomies = await import('#cli/cs/taxonomies/index.js');
			const indexAssets = await import('#cli/cs/assets/index.js');

			vi.mocked(indexContentTypes.default).mockResolvedValue(new Map());
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(indexTaxonomies.default).mockResolvedValue(new Map());
			vi.mocked(indexAssets.default).mockResolvedValue(new Map());

			await clear(mockClient, mockUi, false, []);

			expect(indexContentTypes.default).toHaveBeenCalled();
			expect(indexGlobalFields.default).toHaveBeenCalled();
			expect(indexTaxonomies.default).toHaveBeenCalled();
			expect(indexAssets.default).toHaveBeenCalled();
		});
	});

	describe('when content types specified', () => {
		it('should only delete entries for specified content types', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const deleteContentType = await import('#cli/cs/content-types/delete.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const indexEntriesForLocale =
				await import('#cli/cs/entries/indexEntriesForLocale.js');
			const deleteEntry = await import('#cli/cs/entries/delete.js');
			const { getLocales } = await import('#cli/cs/locales/getLocales.js');

			const mockContentType: ContentType = {
				title: 'Test Content Type',
				uid: 'test_ct',
			} as ContentType;
			const mockEntry: Entry = {
				title: 'Test Entry',
				uid: 'blt123',
			} as Entry;

			vi.mocked(indexContentTypes.default).mockResolvedValue(
				new Map([['test_ct', mockContentType]]),
			);
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(getLocales).mockResolvedValue([
				{ code: 'en-us', name: 'English', uid: 'blt_en' },
				{ code: 'zh-cn', name: 'Chinese', uid: 'blt_zh' },
			]);
			vi.mocked(indexEntriesForLocale.default).mockResolvedValue(
				new Map([['blt123', mockEntry]]),
			);
			vi.mocked(deleteEntry.default).mockResolvedValue({
				deleted: true,
				notFound: false,
			} as Awaited<ReturnType<typeof deleteEntry.default>>);

			await clear(mockClient, mockUi, false, ['test_ct']);

			expect(indexContentTypes.default).toHaveBeenCalled();
			expect(indexGlobalFields.default).toHaveBeenCalled();
			expect(getLocales).toHaveBeenCalledWith(mockClient);
			expect(indexEntriesForLocale.default).toHaveBeenCalledWith(
				mockClient,
				expect.any(Map),
				mockContentType,
				'en-us',
			);
			expect(indexEntriesForLocale.default).toHaveBeenCalledWith(
				mockClient,
				expect.any(Map),
				mockContentType,
				'zh-cn',
			);
			expect(deleteEntry.default).toHaveBeenCalledTimes(1);
			expect(deleteEntry.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
				'blt123',
				true,
			);
			expect(deleteContentType.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
			);
		});

		it('should warn when no matching content types found', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const { getLocales } = await import('#cli/cs/locales/getLocales.js');

			vi.mocked(indexContentTypes.default).mockResolvedValue(new Map());
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(getLocales).mockResolvedValue([
				{ code: 'en-us', name: 'English', uid: 'blt_en' },
			]);

			await clear(mockClient, mockUi, false, ['non_existent']);

			expect(mockUi.warn).toHaveBeenCalledWith(
				'No matching content types found for the specified UIDs.',
			);
		});

		it('should handle multiple content types', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const deleteContentType = await import('#cli/cs/content-types/delete.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const indexEntriesForLocale =
				await import('#cli/cs/entries/indexEntriesForLocale.js');
			const { getLocales } = await import('#cli/cs/locales/getLocales.js');

			const mockContentType1: ContentType = {
				title: 'Content Type 1',
				uid: 'ct1',
			} as ContentType;
			const mockContentType2: ContentType = {
				title: 'Content Type 2',
				uid: 'ct2',
			} as ContentType;

			vi.mocked(indexContentTypes.default).mockResolvedValue(
				new Map([
					['ct1', mockContentType1],
					['ct2', mockContentType2],
				]),
			);
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(getLocales).mockResolvedValue([
				{ code: 'en-us', name: 'English', uid: 'blt_en' },
			]);
			vi.mocked(indexEntriesForLocale.default).mockResolvedValue(new Map());

			await clear(mockClient, mockUi, false, ['ct1', 'ct2']);

			expect(indexEntriesForLocale.default).toHaveBeenCalledWith(
				mockClient,
				expect.any(Map),
				mockContentType1,
				'en-us',
			);
			expect(indexEntriesForLocale.default).toHaveBeenCalledWith(
				mockClient,
				expect.any(Map),
				mockContentType2,
				'en-us',
			);
			expect(deleteContentType.default).toHaveBeenCalledWith(mockClient, 'ct1');
			expect(deleteContentType.default).toHaveBeenCalledWith(mockClient, 'ct2');
		});

		it('should deduplicate entries across locales', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const deleteContentType = await import('#cli/cs/content-types/delete.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const indexEntriesForLocale =
				await import('#cli/cs/entries/indexEntriesForLocale.js');
			const deleteEntry = await import('#cli/cs/entries/delete.js');
			const { getLocales } = await import('#cli/cs/locales/getLocales.js');

			const mockContentType: ContentType = {
				title: 'Test Content Type',
				uid: 'test_ct',
			} as ContentType;
			const mockEntry: Entry = {
				title: 'Test Entry',
				uid: 'blt123',
			} as Entry;
			const mockEntryZh: Entry = {
				title: 'Test Entry (Chinese)',
				uid: 'blt123',
			} as Entry;

			vi.mocked(indexContentTypes.default).mockResolvedValue(
				new Map([['test_ct', mockContentType]]),
			);
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(getLocales).mockResolvedValue([
				{ code: 'en-us', name: 'English', uid: 'blt_en' },
				{ code: 'zh-cn', name: 'Chinese', uid: 'blt_zh' },
			]);
			vi.mocked(indexEntriesForLocale.default)
				.mockResolvedValueOnce(new Map([['blt123', mockEntry]]))
				.mockResolvedValueOnce(new Map([['blt123', mockEntryZh]]));
			vi.mocked(deleteEntry.default).mockResolvedValue({
				deleted: true,
				notFound: false,
			} as Awaited<ReturnType<typeof deleteEntry.default>>);

			await clear(mockClient, mockUi, false, ['test_ct']);

			expect(deleteEntry.default).toHaveBeenCalledTimes(1);
			expect(deleteEntry.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
				'blt123',
				true,
			);
			expect(deleteContentType.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
			);
		});

		it('should delete all localized versions without passing locale parameter', async () => {
			const indexContentTypes = await import('#cli/cs/content-types/index.js');
			const deleteContentType = await import('#cli/cs/content-types/delete.js');
			const indexGlobalFields = await import('#cli/cs/global-fields/index.js');
			const indexEntriesForLocale =
				await import('#cli/cs/entries/indexEntriesForLocale.js');
			const deleteEntry = await import('#cli/cs/entries/delete.js');
			const { getLocales } = await import('#cli/cs/locales/getLocales.js');

			const mockContentType: ContentType = {
				title: 'Test Content Type',
				uid: 'test_ct',
			} as ContentType;
			const mockEntry: Entry = {
				locale: 'zh-cn',
				title: 'Test Entry',
				uid: 'blt123',
			} as Entry;
			vi.mocked(indexContentTypes.default).mockResolvedValue(
				new Map([['test_ct', mockContentType]]),
			);
			vi.mocked(indexGlobalFields.default).mockResolvedValue(new Map());
			vi.mocked(getLocales).mockResolvedValue([
				{ code: 'zh-cn', name: 'Chinese', uid: 'blt_zh' },
			]);
			vi.mocked(indexEntriesForLocale.default).mockResolvedValue(
				new Map([['blt123', mockEntry]]),
			);
			vi.mocked(deleteEntry.default).mockResolvedValue({
				deleted: true,
				notFound: false,
			} as Awaited<ReturnType<typeof deleteEntry.default>>);

			await clear(mockClient, mockUi, false, ['test_ct']);

			expect(deleteEntry.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
				'blt123',
				true,
			);
			expect(deleteContentType.default).toHaveBeenCalledWith(
				mockClient,
				'test_ct',
			);
		});
	});
});
