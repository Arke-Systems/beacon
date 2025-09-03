import getUi from '#cli/schema/lib/SchemaUi.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import { isDeepStrictEqual } from 'node:util';
import type { Item } from '../../Types.js';
import type ApiResponse from './ApiResponse.js';
import type Batch from './Batch.js';
import createAccumulator from './createAccumulator.js';
import readBatch from './readBatch.js';

export default async function readPaginatedItems<TItem extends Item>(
	pluralNoun: string,
	keyFn: (item: TItem) => string,
	fetchFn: (skip: number) => Promise<ApiResponse>,
	mapFn: (data: Record<string, unknown>) => Batch<TItem>,
	equality: (a: TItem, b: TItem) => boolean = isDeepStrictEqual,
): Promise<ReadonlyMap<string, TItem>> {
	const batchFn = async (skip = 0) =>
		readBatch(pluralNoun, fetchFn, mapFn, skip);

	let batch = await batchFn();
	const total = batch.count ?? 0;

	const acc = createAccumulator<TItem>(pluralNoun, keyFn, equality);
	acc.add(batch.items);
	let processedThisBatch = calculateProcessedItemCount(batch);
	let processedInTotal = processedThisBatch;

	// Early exit that avoids the progress bar.
	if (processedInTotal >= total) {
		return acc.result;
	}

	const ui = getUi();
	using bar = ui.createProgressBar(capitalize(pluralNoun), total);
	using reporter = new ProgressReporter(bar, 'Loading', pluralNoun);
	bar.increment(processedThisBatch);

	while (processedInTotal < total) {
		batch = await batchFn(processedInTotal);
		processedThisBatch = calculateProcessedItemCount(batch);

		if (processedThisBatch === 0) {
			ui.warn('Received an empty batch while loading ' + pluralNoun);
			break;
		}

		processedInTotal += processedThisBatch;
		bar.increment(processedThisBatch);
		acc.add(batch.items);
	}

	reporter.finish('Loaded');
	return acc.result;
}

function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function calculateProcessedItemCount<TItem extends Item>(
	batch: Batch<TItem>,
): number {
	return Math.max(0, batch.processedItemCount ?? batch.items.length);
}
