import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import type { TransferContext } from './processPlan.js';

export default async function handleCreations<TItem>(
	ctx: TransferContext<TItem>,
	collectError: (key: string, ex: unknown) => void,
) {
	const created = new Set<string>();

	for (const [key, item] of ctx.plan.toCreate) {
		using reporter = new ProgressReporter(ctx.progress, 'creating', key);

		try {
			await ctx.create(item);
			created.add(key);
		} catch (ex: unknown) {
			collectError(key, ex);
		} finally {
			ctx.progress.increment();
			reporter.finish('created');
		}
	}

	return created;
}
