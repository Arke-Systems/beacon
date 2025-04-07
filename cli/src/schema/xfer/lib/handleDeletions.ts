import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type { TransferContext } from './processPlan.js';

interface Result {
	readonly deleted?: ReadonlySet<string>;
	readonly unmodified?: ReadonlySet<string>;
}

export default async function handleDeletions<TItem>(
	ctx: TransferContext<TItem>,
	collectError: (key: string, ex: unknown) => void,
): Promise<Result> {
	if (ctx.deletionStrategy === 'ignore') {
		return handleIgnoredDeletions(ctx);
	}

	if (ctx.deletionStrategy === 'warn') {
		return handleWarnings(ctx);
	}

	const deleted = new Set<string>();

	for (const [key, item] of ctx.plan.toRemove) {
		using reporter = new ProgressReporter(ctx.progress, 'deleting', key);

		try {
			await ctx.remove(item);
			deleted.add(key);
		} catch (ex: unknown) {
			collectError(key, ex);
		} finally {
			ctx.progress.increment();
			reporter.finish('deleted');
		}
	}

	return { deleted };
}

function handleWarnings<TItem>(ctx: TransferContext<TItem>) {
	const unmodified = new Set<string>();

	for (const [key] of ctx.plan.toRemove) {
		ctx.progress.update({
			action: 'skipping',
			key: `deletion of ${key}`,
		});

		ctx.progress.increment();
		unmodified.add(key);
	}

	return { unmodified };
}

function handleIgnoredDeletions<TItem>(ctx: TransferContext<TItem>) {
	ctx.progress.update({
		action: 'skipping',
		key: `${ctx.plan.toRemove.size.toLocaleString()} deletions`,
	});

	ctx.progress.increment(ctx.plan.toRemove.size);
	const unmodified = new Set<string>([...ctx.plan.toRemove.keys()]);
	return { unmodified };
}
