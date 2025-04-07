import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type { TransferContext } from './processPlan.js';

export default async function handleUpdates<TItem>(
	ctx: TransferContext<TItem>,
	collectError: (key: string, ex: unknown) => void,
) {
	const updated = new Set<string>();

	for (const [key, item] of ctx.plan.toUpdate) {
		using reporter = new ProgressReporter(ctx.progress, 'updating', key);

		try {
			await ctx.update(item);
			updated.add(key);
		} catch (ex: unknown) {
			collectError(key, ex);
		} finally {
			ctx.progress.increment();
			reporter.finish('updated');
		}
	}

	return updated;
}
