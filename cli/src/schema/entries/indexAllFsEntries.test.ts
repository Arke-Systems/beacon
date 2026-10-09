import { expect, it, vi } from 'vitest';
import type UiContext from '../../ui/UiContext.js';
import Filename from '../xfer/Filename.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
import getUi from '../lib/SchemaUi.js';
import indexAllFsEntries from './indexAllFsEntries.js';

vi.mock(import('../content-types/indexFromFilesystem.js'), () => ({
	default: vi.fn(
		async () =>
			await Promise.resolve(
				new Map([
					[
						'blog_post',
						{
							[Filename]: 'blog_post.yaml',
							schema: [],
							title: 'Blog Post',
							uid: 'blog_post',
						},
					],
				]),
			),
	),
}));

vi.mock(import('../xfer/indexFromFilesystem.js'), () => ({
	default: vi.fn(),
}));

vi.mock(import('../lib/SchemaUi.js'), () => ({
	default: vi.fn(),
}));

const mockGetUi = vi.mocked(getUi);

it('keeps content types without reading excluded entry files', async () => {
	// Arrange
	mockGetUi.mockReturnValue(buildMockUi(() => false));

	// Act
	const entries = await indexAllFsEntries();

	// Assert
	const actual = [...entries.keys()].map((contentType) => contentType.uid);
	const expected = ['blog_post'];

	expect(actual).toEqual(expected);
	expect(indexFromFilesystem).not.toHaveBeenCalled();
});

function buildMockUi(
	isIncluded: (contentTypeUid: string) => boolean,
): UiContext {
	return {
		options: { schema: { entries: { isIncluded } } },
	} as UiContext;
}
