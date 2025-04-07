import apiMove from '#cli/cs/terms/move.js';
import type Term from '#cli/cs/terms/Term.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type Collection from '../Collection.js';

export default function move(
	this: Collection,
	term: Term,
	newParentUid: string | null,
	newIdx?: number,
): ((bar: ProgressBar) => Promise<TransferResults>) | undefined {
	const existing = this.getRequired(term.uid);
	if (existing.parent_uid === newParentUid) {
		return;
	}

	const { siblings: oldSiblings, idx: oldIdx } =
		this.getSiblingContext(existing);

	oldSiblings.splice(oldIdx, 1);
	existing.parent_uid = newParentUid;
	const order = this.insertTermIntoSiblings(existing, newIdx) + 1;

	return async (bar) => {
		const results = new MutableTransferResults();
		using reporter = new ProgressReporter(bar, 'moving', term.name);

		try {
			await apiMove(
				this.client,
				this.taxonomy.uid,
				term.uid,
				newParentUid,
				order,
			);

			results.updated.add(term.uid);
		} catch (ex: unknown) {
			results.errored.set(term.uid, ex);
		} finally {
			bar.increment();
			reporter.finish('moved');
		}

		return results;
	};
}
