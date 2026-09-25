import { expect, it, vi } from 'vitest';
import indexAllCsEntries from './indexAllCsEntries.js';
import indexEntries from './index.js';

vi.mock(import('../content-types/index.js'), () => ({
	default: vi.fn(
		async () =>
			await Promise.resolve(
				new Map([
					['blog_post', { schema: [], title: 'Blog Post', uid: 'blog_post' }],
					['page', { schema: [], title: 'Page', uid: 'page' }],
				]),
			),
	),
}));
vi.mock(import('../global-fields/index.js'), () => ({
	default: vi.fn(async () => await Promise.resolve(new Map())),
}));
vi.mock(import('./index.js'), () => ({ default: vi.fn() }));
vi.mock('../../schema/lib/SchemaUi.js', () => ({
	default: () => ({
		createProgressBar: () => ({
			[Symbol.dispose]: () => undefined,
			increment: () => undefined,
			update: () => undefined,
		}),
	}),
}));

it('keeps content types while skipping entry requests for excluded types', async () => {
	const [globalFields, entries] = await indexAllCsEntries(
		{} as Parameters<typeof indexAllCsEntries>[0],
		() => false,
	);

	expect(globalFields.size).toBe(0);
	expect([...entries.keys()].map((contentType) => contentType.uid)).toEqual([
		'blog_post',
		'page',
	]);
	expect([...entries.values()].every((value) => value.size === 0)).toBe(true);
	expect(indexEntries).not.toHaveBeenCalled();
});

it('indexes all types when a selected type may reference an excluded type', async () => {
	vi.mocked(indexEntries).mockResolvedValue(new Map());

	await indexAllCsEntries(
		{} as Parameters<typeof indexAllCsEntries>[0],
		(uid) => uid === 'blog_post',
	);

	expect(indexEntries).toHaveBeenCalledTimes(['blog_post', 'page'].length);
});
