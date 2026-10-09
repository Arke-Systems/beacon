import { expect, it, vi } from 'vitest';
import Filename from '../xfer/Filename.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
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

it('keeps content types without reading excluded entry files', async () => {
	// Act
	const entries = await indexAllFsEntries(() => false);

	// Assert
	const actual = [...entries.keys()].map((contentType) => contentType.uid);
	const expected = ['blog_post'];

	expect(actual).toEqual(expected);
	expect(indexFromFilesystem).not.toHaveBeenCalled();
});
