import type Term from '#cli/cs/terms/Term.js';
import type Collection from '../Collection.js';

export default function insertTermIntoSiblings(
	this: Collection,
	term: Term,
	idx?: number,
) {
	const siblings = this.byParentUid.get(term.parent_uid);

	if (siblings) {
		if (typeof idx === 'number') {
			siblings.splice(idx, 0, term);
		} else {
			siblings.push(term);
		}
	} else {
		this.byParentUid.set(term.parent_uid, [term]);
	}

	return typeof idx === 'number' ? idx : (siblings?.length ?? 0);
}
