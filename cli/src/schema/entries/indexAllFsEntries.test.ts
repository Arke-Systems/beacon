import { expect, it, vi } from 'vitest';
import indexAllFsEntries from './indexAllFsEntries.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
import Filename from '../xfer/Filename.js';

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
	const entries = await indexAllFsEntries(() => false);

	expect([...entries.keys()].map((contentType) => contentType.uid)).toEqual([
		'blog_post',
	]);
	expect(indexFromFilesystem).not.toHaveBeenCalled();
});
