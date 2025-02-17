import flatten from '#cli/dto/taxonomy/flatten.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import type CsTermCollection from '#cli/schema/ctx/lib/CsTermCollection.js';
import type TermAction from './TermAction.js';

export default function* deletions(
	fs: NormalizedTaxonomy,
	csTerms: CsTermCollection,
): Generator<TermAction> {
	const fsTermUids = new Set(flatten(fs.terms ?? []).map((x) => x.uid));

	const getFirstTermForRemoval = () => {
		// This intentionally re-start iteration from the beginning each time it
		// is called because the act of removing a term from the collection will
		// mutate the collection. We want to continue removing terms until there
		// are no further mutations to make.
		for (const csTerm of csTerms.all()) {
			if (fsTermUids.has(csTerm.uid)) {
				continue;
			}

			return csTerm;
		}
	};

	let csTerm = getFirstTermForRemoval();
	while (csTerm) {
		// The call to csTerms.remove() is a mutation, requiring us to restart
		// the call to csTerms.all()
		yield { fn: csTerms.remove(csTerm), key: csTerm.uid, type: 'delete' };
		csTerm = getFirstTermForRemoval();
	}
}
