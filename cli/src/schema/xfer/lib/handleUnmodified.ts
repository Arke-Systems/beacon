import getUi from '#cli/schema/lib/SchemaUi.js';
import type { TransferContext } from './processPlan.js';

export default async function handleUnmodified<TItem>(
	ctx: TransferContext<TItem>,
) {
	const unmodified = new Set(ctx.plan.toSkip.keys());

	if (unmodified.size > 0) {
		const noun = unmodified.size === 1 ? 'item' : 'items';
		const key = `${unmodified.size.toLocaleString()} unmodified ${noun}`;

		// If an unmodified handler is provided, process unmodified items
		// This allows checking/updating secondary data like locale versions
		if (ctx.unmodified) {
			if (getUi().options.verbose) {
				ctx.progress.update({ action: 'processing', key });
			}

			for (const item of ctx.plan.toSkip.values()) {
				try {
					await ctx.unmodified(item);
				} catch {
					// Ignore errors for unmodified items to avoid blocking the transfer
					// The main content is already correct, this is just for secondary data
				}
				ctx.progress.increment();
			}
		} else {
			if (getUi().options.verbose) {
				ctx.progress.update({ action: 'skipping', key });
			}
			ctx.progress.increment(unmodified.size);
		}
	}

	return unmodified;
}
