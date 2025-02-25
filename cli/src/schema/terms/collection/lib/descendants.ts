import type Term from '#cli/cs/terms/Term.js';
import type Collection from '../Collection.js';

export default function* descendants(
	this: Collection,
	parentUid: string | null,
): Generator<Term> {
	const children = this.children(parentUid);

	for (const child of children) {
		yield child;
		yield* this.descendants(child.uid);
	}
}
