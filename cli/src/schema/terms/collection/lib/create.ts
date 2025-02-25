import apiCreate from '#cli/cs/terms/create.js';
import type Term from '#cli/cs/terms/Term.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type Collection from '../Collection.js';

export default function create(
	this: Collection,
	term: Term,
	idx?: number,
): (bar: ProgressBar) => Promise<TransferResults> {
	this.byUid.set(term.uid, term);
	const order = this.insertTermIntoSiblings(term, idx) + 1;

	return async (bar) => {
		const results = new MutableTransferResults();
		using reporter = new ProgressReporter(bar, 'creating', term.name);

		try {
			await apiCreate(this.client, this.taxonomy.uid, term, order);
			results.created.add(term.uid);
		} catch (ex: unknown) {
			results.errored.set(term.uid, ex);
		} finally {
			reporter.finish('created');
			bar.increment();
		}

		return results;
	};
}
