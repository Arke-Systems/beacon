import EntryCollection from '#cli/schema/entries/EntryCollection.js';
import { describe, expect, it, vi } from 'vitest';
import type { ReferencePath } from '../../cs/entries/Types.js';
import type UiContext from '../../ui/UiContext.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import { ReferenceMap } from '../references/ReferenceMap.js';
import recordExcludedReferences from './recordExcludedReferences.js';

vi.mock(import('../lib/SchemaUi.js'), () => ({ default: vi.fn() }));

const mockGetUi = vi.mocked(getUi);

describe(recordExcludedReferences.name, () => {
	it('resolves references to existing excluded entries', () => {
		// Arrange
		const blogPost = { schema: [], title: 'Blog Post', uid: 'blog_post' };
		const category = { schema: [], title: 'Category', uid: 'category' };
		const newBlogPost = { title: 'New', uid: 'bltnewblogpost' };
		const existingCategory = { title: 'Existing', uid: 'bltcategory' };
		const ui = buildMockUi((contentTypeUid) => contentTypeUid === blogPost.uid);
		mockGetUi.mockReturnValue(ui);
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

		// Act
		recordExcludedReferences(ctx);


		// Assert
		const from: ReferencePath = `${blogPost.uid}/${newBlogPost.title}`;
		const to: ReferencePath = `${category.uid}/${existingCategory.title}`;
		const actual = references.findReferencedUid(from, to);
		expect(actual).toBe(existingCategory.uid);
		expect(references.missed).toBe(0);
	});
});

function buildMockUi(isIncluded: (contentTypeUid: string) => boolean) {
	return {
		options: { schema: { entries: { isIncluded } } },
	} as UiContext;
}
