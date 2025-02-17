import type TaxonomyDetail from '#cli/cs/taxonomies/TaxonomyDetail.js';
import type { TermTreeNode } from './NormalizedTaxonomy.js';

// Taxonomy terms have a tree structure defined by uid/parent_uid.
//
// However, the API returns a flat array that includes uid/parent_uid, but
// leaves it up to the client to reconstruct the tree.
//
// Amongst the siblings of a single branch, the sort order is relevant and
// must be maintained, equal to the order as it appears in the array.
//
// However, Contentstack is returning an inconsistent order for nodes on
// the same level but on different branches. That is, the branches are
// intertwined with each other. This means we cannot blindly trust the sort
// order of the array as a whole, only within the siblings of a single branch.
// Last observed on 2024-08-14.
//
// To prove equality, we need to parse the tree structure and compare for
// deep equality only after sorting the siblings of each branch.

type MutableNode = Omit<TermTreeNode, 'children'> & {
	children?: MutableNode[];
};

export default function organize(
	terms: TaxonomyDetail['terms'],
): readonly TermTreeNode[] {
	const byUid = new Map<string, MutableNode>();
	const topLevel: MutableNode[] = [];

	for (const { uid, name } of terms) {
		// Justification: Keys are placed in this order for readability in
		// the serialization of the object.
		// eslint-disable-next-line sort-keys
		byUid.set(uid, { uid, name });
	}

	for (const { uid, parent_uid } of terms) {
		const term = byUid.get(uid);
		if (!term) {
			throw new Error(`Term ${uid} not found`);
		}

		if (!parent_uid) {
			topLevel.push(term);
			continue;
		}

		const parent = byUid.get(parent_uid);
		if (!parent) {
			const msg = `Orphaned term ${uid} with parent ${parent_uid}`;
			throw new Error(msg);
		}

		(parent.children ??= []).push(term);
	}

	return topLevel;
}
