import EntryCollection from '#cli/schema/entries/EntryCollection.js';
import { expect, it, vi } from 'vitest';
import type UiContext from '../../ui/UiContext.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import { ReferenceMap } from '../references/ReferenceMap.js';
import recordExcludedReferences from './recordExcludedReferences.js';

vi.mock(import('../lib/SchemaUi.js'), () => ({
	default: vi.fn(),
}));

const mockGetUi = vi.mocked(getUi);

it('resolves references to existing excluded entries without syncing them', () => {
	const blogPost = { schema: [], title: 'Blog Post', uid: 'blog_post' };
	const category = { schema: [], title: 'Category', uid: 'category' };
	const existingCategory = { title: 'Existing', uid: 'bltcategory' };
	mockGetUi.mockReturnValue(
		buildMockUi((contentTypeUid) => contentTypeUid === blogPost.uid),
	);
	const references = new ReferenceMap();
	const ctx = {
		cs: {
			entries: new EntryCollection(
				new Map([[category, new Set([existingCategory])]]),
			),
		},
		fs: {
			contentTypes: new Map([
				[blogPost.uid, blogPost],
				[category.uid, category],
			]),
		},
		references,
	} as unknown as Ctx;

	recordExcludedReferences(ctx);

	expect(
		references.seal().findReferencedUid('blog_post/New', 'category/Existing'),
	).toBe(existingCategory.uid);
	expect(references.missed).toBe(0);
});

function buildMockUi(
	isIncluded: (contentTypeUid: string) => boolean,
): UiContext {
	return {
		options: { schema: { entries: { isIncluded } } },
	} as UiContext;
}
