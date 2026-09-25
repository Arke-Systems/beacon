import EntryCollection from '#cli/schema/entries/EntryCollection.js';
import { expect, it } from 'vitest';
import type Ctx from '../ctx/Ctx.js';
import { ReferenceMap } from '../references/ReferenceMap.js';
import recordExcludedReferences from './recordExcludedReferences.js';

it('resolves references to existing excluded entries without syncing them', () => {
	const blogPost = { schema: [], title: 'Blog Post', uid: 'blog_post' };
	const category = { schema: [], title: 'Category', uid: 'category' };
	const existingCategory = { title: 'Existing', uid: 'bltcategory' };
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

	recordExcludedReferences(ctx, (uid) => uid === blogPost.uid);

	expect(
		references.seal().findReferencedUid('blog_post/New', 'category/Existing'),
	).toBe(existingCategory.uid);
	expect(references.missed).toBe(0);
});
