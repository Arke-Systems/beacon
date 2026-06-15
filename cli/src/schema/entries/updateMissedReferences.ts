import importEntry from '#cli/cs/entries/import.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import transformEntry from '#cli/dto/entry/toCs.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import type TransferResults from '../xfer/TransferResults.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';

export default async function updateMissedReferences(
	ctx: Ctx,
): Promise<TransferResults> {
	const { references } = ctx;
	const { missed } = references;
	const results = new MutableTransferResults();

	if (missed === 0) {
		return results;
	}

	using bar = getUi().createProgressBar('References', missed);
	const minimalCtx = { cs: ctx.cs, fs: ctx.fs, references: references.seal() };

	for (const [
		contentTypeUid,
		entry,
	] of references.entriesWithMissedReferences()) {
		const contentType = ctx.fs.contentTypes.get(contentTypeUid);
		if (!contentType) {
			throw new Error(`Content type not found: ${contentTypeUid}`);
		}

		const refPath: ReferencePath = `${contentType.uid}/${entry.title}`;
		using reporter = new ProgressReporter(bar, 'updating', refPath);

		try {
			const transformed = transformEntry(minimalCtx, contentType, entry);
			await importEntry(ctx.cs.client, contentTypeUid, transformed, true);
			results.updated.add(refPath);
		} catch (ex: unknown) {
			results.errored.set(refPath, ex);
		} finally {
			bar.increment();
			reporter.finish('updated');
		}
	}

	return results;
}
