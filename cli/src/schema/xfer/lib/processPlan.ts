import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type TransferResults from '../TransferResults.js';
import { MutableTransferResults } from '../TransferResults.js';
import handleCreations from './handleCreations.js';
import handleDeletions from './handleDeletions.js';
import handleUnmodified from './handleUnmodified.js';
import handleUpdates from './handleUpdates.js';
import type MergePlan from './MergePlan.js';

export interface TransferContext<TItem> {
	readonly create: (item: TItem) => Promise<unknown>;
	readonly deletionStrategy: 'delete' | 'ignore' | 'warn';
	readonly plan: MergePlan<TItem>;
	readonly progress: ProgressBar;
	readonly remove: (item: TItem) => Promise<void>;
	readonly update: (item: TItem) => Promise<unknown>;
}

export default async function processPlan<TItem>(
	ctx: TransferContext<TItem>,
): Promise<TransferResults> {
	const total =
		ctx.plan.toCreate.size + ctx.plan.toRemove.size + ctx.plan.toUpdate.size;

	const unmodified = handleUnmodified(ctx);

	if (total === 0) {
		const result = new MutableTransferResults();
		unmodified.forEach((key) => result.unmodified.add(key));
		return result;
	}

	const errored = new Map<string, unknown>();
	const collectError = (key: string, ex: unknown) => errored.set(key, ex);

	// The order of deletions, creations, and updates is important:
	//
	// When transferring entries from Contentstack to the filesystem, we cannot
	// use the UID as a filename because it is not stable as a key. Instead, we
	// sanitize the title and use that. However, part of sanitizing means we must
	// ensure the titles are unique filenames. During this process, titles are
	// compared for uniqueness only against the files that _will eventually_ exist
	// _after_ the transfer.
	//
	// Thus, there is a chance that a filename will _not_ be unique when compared
	// to the files that _currently_ exist.
	//
	// To avoid this, we must remove any extra files before we create new ones.
	//
	// Also, when processing updates, if any updated schemas refer to content
	// types that have not yet been created, Contentstack will throw an error.
	// To help avoid this, we make sure creations are done before updates.
	const deleted = await handleDeletions(ctx, collectError);
	const created = await handleCreations(ctx, collectError);
	const updated = await handleUpdates(ctx, collectError);

	return {
		...mergeDeletionResults(unmodified, deleted),
		created,
		errored,
		updated,
	};
}

function mergeDeletionResults(
	unmodified: ReadonlySet<string>,
	{
		deleted = new Set<string>(),
		unmodified: skippedDeletion = new Set<string>(),
	}: Awaited<ReturnType<typeof handleDeletions>>,
) {
	if (skippedDeletion.size === 0) {
		return { deleted, unmodified };
	}

	const mergedUnmodified = new Set<string>(unmodified);

	for (const key of skippedDeletion) {
		mergedUnmodified.add(key);
	}

	return {
		deleted,
		unmodified: mergedUnmodified,
	};
}
