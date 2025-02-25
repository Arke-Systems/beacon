import type Term from '#cli/cs/terms/Term.js';
import type Collection from '../Collection.js';

interface Result {
	readonly idx: number;

	// Intentionally returns a mutable array. Consumers are expected to mutate it
	// to adjust sibling order.
	readonly siblings: Term[];
}

export function getSiblingContext(this: Collection, term: Term): Result {
	const siblings = this.byParentUid.get(term.parent_uid);
	if (!siblings) {
		throw new Error('Parent not found');
	}

	const idx = siblings.findIndex((s) => s.uid === term.uid);
	if (idx === -1) {
		throw new Error('Term not found in parent');
	}

	return { idx, siblings };
}
