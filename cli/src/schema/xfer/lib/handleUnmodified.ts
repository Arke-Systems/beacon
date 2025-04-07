import type { TransferContext } from './processPlan.js';

export default function handleUnmodified<TItem>(ctx: TransferContext<TItem>) {
	const unmodified = new Set(ctx.plan.toSkip.keys());

	if (unmodified.size > 0) {
		const noun = unmodified.size === 1 ? 'item' : 'items';
		const key = `${unmodified.size.toLocaleString()} unmodified ${noun}`;

		ctx.progress.update({ action: 'skipping', key });
		ctx.progress.increment(unmodified.size);
	}

	return unmodified;
}
