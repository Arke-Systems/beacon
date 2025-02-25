import type Term from '#cli/cs/terms/Term.js';

export default interface MutableTerm {
	readonly uid: Term['uid'];
	name: Term['name'];
	parent_uid: Term['parent_uid'];
}
