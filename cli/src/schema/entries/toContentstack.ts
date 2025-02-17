import type { ContentType } from '#cli/cs/content-types/Types.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import importEntry from '#cli/cs/entries/import.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import BeaconReplacer from '#cli/dto/entry/BeaconReplacer.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import equality from './equality.js';
import buildCreator from './lib/buildCreator.js';

export default async function toContentstack(
	ctx: Ctx,
	contentType: ContentType,
	bar: ProgressBar,
) {
	const ui = getUi();

	const fsEntriesByTitle = ctx.fs.entries.byTitleFor(contentType.uid);
	const csEntriesByTitle = ctx.cs.entries.byTitleFor(contentType.uid);
	const transformer = new BeaconReplacer(ctx, contentType);
	const create = buildCreator(ctx, transformer, contentType);
	const update = buildUpdateFn(ctx, csEntriesByTitle, transformer, contentType);

	const result = await processPlan<Entry>({
		create,
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan: planMerge(equality, fsEntriesByTitle, csEntriesByTitle),
		progress: bar,
		remove: async (entry) =>
			deleteEntry(ctx.cs.client, contentType.uid, entry.uid),
		update,
	});

	for (const title of result.unmodified) {
		const cs = csEntriesByTitle.get(title);
		const fs = fsEntriesByTitle.get(title);

		if (cs && !fs && ui.options.schema.deletionStrategy !== 'delete') {
			// The entry was deleted from the file system, but the user has chosen
			// to ignore deletions in Contentstack. The item is invalid as a
			// reference, but does not represent an error state.
			continue;
		}

		if (!cs || !fs) {
			throw new Error(`No matching entry found for ${title}.`);
		}

		const entry = { ...fs, uid: cs.uid };
		ctx.references.recordEntryForReferences(contentType.uid, entry);
	}

	return result;
}

function buildUpdateFn(
	ctx: Ctx,
	csEntriesByTitle: ReadonlyMap<string, Entry>,
	transformer: BeaconReplacer,
	contentType: ContentType,
) {
	return async (entry: Entry) => {
		const match = csEntriesByTitle.get(entry.title);

		if (!match) {
			throw new Error(`No matching entry found for ${entry.title}.`);
		}

		const transformed = transformer.process(entry);

		const updated = await importEntry(
			ctx.cs.client,
			contentType.uid,
			{ ...transformed, uid: match.uid },
			true,
		);

		ctx.references.recordEntryForReferences(contentType.uid, {
			...entry,
			uid: updated.uid,
		});
	};
}
