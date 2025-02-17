import type { TransferContext } from './processPlan.js';

export default function handleUnmodified<TItem>(ctx: TransferContext<TItem>) {
	const unmodified = new Set(ctx.plan.toSkip.keys());

	if (unmodified.size > 0) {
		ctx.progress.update({
			action: 'skipping',
			key: `${unmodified.size.toLocaleString()} unmodified items`,
		});

		ctx.progress.increment(unmodified.size);
	}

	return unmodified;
}
