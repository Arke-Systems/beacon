import apiRemove from '#cli/cs/terms/remove.js';
import type Term from '#cli/cs/terms/Term.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type Collection from '../Collection.js';

export default function remove(
	this: Collection,
	term: Term,
): (bar: ProgressBar) => Promise<TransferResults> {
	const existing = this.getRequired(term.uid);
	const descendants = [...this.descendants(existing.uid)];
	const { siblings, idx } = this.getSiblingContext(existing);

	this.byUid.delete(term.uid);
	this.byParentUid.delete(term.uid);
	siblings.splice(idx, 1);

	for (const descendant of descendants) {
		this.byUid.delete(descendant.uid);
		this.byParentUid.delete(descendant.uid);
	}

	return async (bar) => {
		const results = new MutableTransferResults();
		const strategy = getUi().options.schema.deletionStrategy;
		const toDelete = [term, ...descendants].map((d) => d.uid);
		const descendantCount = descendants.length;

		const descendantMsg =
			descendantCount === 0
				? ''
				: descendantCount === 1
					? '1 descendant'
					: `${descendantCount.toLocaleString()} descendants`;

		const msg = [term.name, descendantMsg].filter(Boolean).join(' and ');

		if (strategy === 'delete') {
			using reporter = new ProgressReporter(bar, 'deleting', msg);

			try {
				await apiRemove(this.client, this.taxonomy.uid, term.uid);
				toDelete.forEach((d) => results.deleted.add(d));
			} catch (ex: unknown) {
				results.errored.set(term.uid, ex);
				// Do we include descendants here as well? They didn't really error.
			} finally {
				reporter.finish('deleted');
				bar.increment();
			}
		}

		if (strategy === 'warn') {
			bar.update({ action: 'skipping', key: `deletion of ${msg}` });
		}

		if (strategy === 'ignore' || strategy === 'warn') {
			results.unmodified.add(term.uid);
			bar.increment();
		}

		return results;
	};
}
