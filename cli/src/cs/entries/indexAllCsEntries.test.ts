import { expect, it, vi } from 'vitest';
import getUi from '../../schema/lib/SchemaUi.js';
import type UiContext from '../../ui/UiContext.js';
import type Client from '../api/Client.js';
import indexEntries from './index.js';
import indexAllCsEntries from './indexAllCsEntries.js';

vi.mock(import('../content-types/index.js'), () => ({
	default: vi.fn(
		async () =>
			await Promise.resolve(
				new Map([
					[blogPostSchema.uid, blogPostSchema],
					[pageSchema.uid, pageSchema],
				]),
			),
	),
}));

vi.mock(import('../global-fields/index.js'), () => ({
	default: vi.fn(async () => await Promise.resolve(globalFields)),
}));

vi.mock(import('./index.js'), () => ({ default: vi.fn() }));

vi.mock(import('../../schema/lib/SchemaUi.js'), () => ({
	default: vi.fn(),
}));

const mockGetUi = vi.mocked(getUi);
const globalFields = new Map();
const blogPostSchema = { schema: [], title: 'Blog Post', uid: 'blog_post' };
const pageSchema = { schema: [], title: 'Page', uid: 'page' };

it('keeps content types while skipping excluded entry requests', async () => {
	// Arrange
	const client = {} as Client;
	const isIncluded = () => false;
	mockGetUi.mockReturnValue(buildMockUi(isIncluded));

	// Act
	const [, entries] = await indexAllCsEntries(client);

	// Assert
	const expected = new Map([
		[blogPostSchema, new Set()],
		[pageSchema, new Set()],
	]);

	expect(entries).toEqual(expected);
	expect(indexEntries).not.toHaveBeenCalled();
});

it('indexes all types when any type is included', async () => {
	// Arrange
	const client = {} as Client;
	const isIncluded = (contentTypeUid: string) => contentTypeUid === 'blog_post';
	mockGetUi.mockReturnValue(buildMockUi(isIncluded));
	vi.mocked(indexEntries).mockResolvedValue(new Map());

	// Act
	await indexAllCsEntries(client);

	// Assert
	expect(indexEntries).toHaveBeenCalledWith(
		client,
		globalFields,
		blogPostSchema,
	);

	expect(indexEntries).toHaveBeenCalledWith(client, globalFields, pageSchema);
});

function buildMockUi(
	isIncluded: (contentTypeUid: string) => boolean,
): UiContext {
	return {
		createProgressBar: () => ({
			[Symbol.dispose]: () => undefined,
			increment: () => undefined,
			update: () => undefined,
		}),
		error: vi.fn(),
		info: vi.fn(),
		options: { schema: { entries: { isIncluded } } },
		warn: vi.fn(),
	} as unknown as UiContext;
}
