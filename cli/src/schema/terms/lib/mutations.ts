import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import type { TermTreeNode } from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import type CsTermCollection from '#cli/schema/ctx/lib/CsTermCollection.js';
import deletions from './deletions.js';
import type TermAction from './TermAction.js';

type MaybeTermAction = Omit<TermAction, 'fn'> & {
	readonly fn: TermAction['fn'] | undefined;
};

export default function mutations(
	fs: NormalizedTaxonomy,
	csTerms: CsTermCollection,
): readonly TermAction[] {
	function* traverse(
		fsTerms: readonly TermTreeNode[],
		parentUid: string | null,
	): Generator<MaybeTermAction> {
		for (let idx = 0; idx < fsTerms.length; idx += 1) {
			const fsTerm = fsTerms[idx];
			if (!fsTerm) {
				throw new Error('Missing term');
			}

			const { uid: key } = fsTerm;

			const existing = csTerms.get(fsTerm.uid);

			if (existing) {
				// Handle any name changes.
				const fn = csTerms.update(existing, fsTerm.name);
				yield { fn, key, type: 'update' };
			}

			// This intentionally re-queries the term in the index position because
			// each iteration of the loop could potentially mutate the collection.
			if (csTerms.children(parentUid)[idx]?.uid === key) {
				// Early exit: there is a term in the correct position, and the
				// UIDs match, so there is nothing further to do.
				yield* traverse(fsTerm.children ?? [], key);
				continue;
			}

			if (existing) {
				// There is a term with a matching UID _somewhere_ in the hierarchy,
				// but it isn't in the right position. It needs to be moved into place.
				const fn = csTerms.move(existing, parentUid, idx);
				yield { fn, key, type: 'move' };
			} else {
				// There is no existing term with a matching UID, so we need to create
				// one and insert it into position.
				const fn = csTerms.create({ ...fsTerm, parent_uid: parentUid }, idx);
				yield { fn, key, type: 'create' };
			}

			yield* traverse(fsTerm.children ?? [], key);
		}
	}

	const maybeActions = [
		...deletions(fs, csTerms),
		...traverse(fs.terms ?? [], null),
	];

	const isAction = (x: MaybeTermAction): x is TermAction => x.fn !== undefined;
	return maybeActions.filter(isAction);
}
