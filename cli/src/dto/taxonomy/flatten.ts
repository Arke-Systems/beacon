import type Term from '#cli/cs/terms/Term.js';
import type { TermTreeNode } from './NormalizedTaxonomy.js';

export default function flatten(
	terms: readonly TermTreeNode[],
): readonly Term[] {
	const result: Term[] = [];

	function traverse(nodes: readonly TermTreeNode[], parentUid: string | null) {
		for (const node of nodes) {
			const { children, ...term } = node;

			result.push({
				...term,
				parent_uid: parentUid,
			});

			if (children) {
				traverse(children, node.uid);
			}
		}
	}

	traverse(terms, null);

	return result;
}
