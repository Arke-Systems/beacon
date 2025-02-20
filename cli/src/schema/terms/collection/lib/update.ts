import type Term from '#cli/cs/terms/Term.js';
import apiUpdate from '#cli/cs/terms/update.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type Collection from '../Collection.js';

export default function update(
	this: Collection,
	term: Term,
	name: string,
): ((bar: ProgressBar) => Promise<TransferResults>) | undefined {
	const existing = this.getRequired(term.uid);
	if (existing.name === name) {
		return;
	}

	existing.name = name;

	return async (bar) => {
		const results = new MutableTransferResults();
		using reporter = new ProgressReporter(bar, 'updating', term.uid);

		try {
			await apiUpdate(this.client, this.taxonomy.uid, term.uid, name);
			results.updated.add(term.uid);
		} catch (ex: unknown) {
			results.errored.set(term.uid, ex);
		} finally {
			reporter.finish('updated');
			bar.increment();
		}

		return results;
	};
}
