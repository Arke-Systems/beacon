import type Term from '#cli/cs/terms/Term.js';
import type Collection from '../Collection.js';

export default function getRequired(this: Collection, uid: Term['uid']) {
	const existing = this.byUid.get(uid);
	if (!existing) {
		throw new Error(`Term ${uid} not found`);
	}

	return existing;
}
