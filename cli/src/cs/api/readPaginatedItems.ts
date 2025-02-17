import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect, isDeepStrictEqual, styleText } from 'node:util';
import getUi from '../../schema/lib/SchemaUi.js';
import HandledError from '../../ui/HandledError.js';
import type { Item } from '../Types.js';
import ContentstackError from './ContentstackError.js';

interface ApiResponse {
	readonly data?: unknown;
	readonly error?: unknown;
}

interface Batch<TItem extends Item> {
	readonly count?: number;
	readonly items: readonly TItem[];
	readonly processedItemCount?: number;
}

export default async function readPaginatedItems<TItem extends Item>(
	pluralNoun: string,
	keyFn: (item: TItem) => string,
	fetchFn: (skip: number) => Promise<ApiResponse>,
	mapFn: (data: Record<string, unknown>) => Batch<TItem>,
): Promise<ReadonlyMap<string, TItem>> {
	const batchFn = async (skip = 0) =>
		readBatch(pluralNoun, fetchFn, mapFn, skip);

	let batch = await batchFn();
	const total = batch.count ?? 0;

	const acc = createAccumulator<TItem>(pluralNoun, keyFn);
	acc.add(batch.items);
	let processedThisBatch = calculateProcessedItemCount(batch);
	let processedInTotal = processedThisBatch;

	// Early exit that avoids the progress bar.
	if (processedInTotal >= total) {
		return acc.result;
	}

	const ui = getUi();
	using bar = ui.createProgressBar(pluralNoun, total);
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

async function readBatch<TItem extends Item>(
	pluralNoun: string,
	fetchFn: (skip: number) => Promise<ApiResponse>,
	mapFn: (data: Record<string, unknown>) => Batch<TItem>,
	skip = 0,
): Promise<Batch<TItem>> {
	const { data, error } = await fetchFn(skip);
	ContentstackError.throwIfError(error, `Failed to get ${pluralNoun}`);

	if (!isRecord(data)) {
		throw new Error('Invalid response from Contentstack');
	}

	return mapFn(data);
}

function createAccumulator<TItem extends Item>(
	pluralNoun: string,
	keyFn: (item: TItem) => string,
) {
	const acc = new Map<string, TItem>();
	const handleDuplicateItems = duplicateItemHandler.bind(null, pluralNoun, acc);

	return {
		add(items: readonly TItem[]) {
			for (const item of items) {
				const key = keyFn(item);
				handleDuplicateItems(key, item);
				acc.set(key, item);
			}
		},
		get result(): ReadonlyMap<string, TItem> {
			return acc;
		},
	};
}

function duplicateItemHandler(
	pluralNoun: string,
	acc: ReadonlyMap<string, unknown>,
	key: string,
	item: unknown,
) {
	const existing = acc.get(key);

	if (existing === undefined) {
		return;
	}

	const msgs = ['Encountered a duplicate item while indexing '];
	msgs.push(styleText('bold', pluralNoun));
	msgs.push(' by key: ');

	if (key === '') {
		msgs.push(styleText('dim', '[empty string]'));
	} else {
		msgs.push(styleText('bold', key));
	}

	msgs.push('.');

	if (isDeepStrictEqual(existing, item)) {
		getUi().warn(msgs.join(''));
		return;
	}

	msgs.push('\nThis is fatal because the items are not equal!\n');
	msgs.push(styleText('bold', 'First'));
	msgs.push(': ');
	msgs.push(inspect(existing, { colors: true, depth: Infinity }));

	msgs.push('\n');
	msgs.push(styleText('bold', 'Second'));
	msgs.push(': ');
	msgs.push(inspect(item, { colors: true, depth: Infinity }));

	const msg = msgs.join('');

	throw new HandledError(msg);
}

function calculateProcessedItemCount<TItem extends Item>(
	batch: Batch<TItem>,
): number {
	return Math.max(0, batch.processedItemCount ?? batch.items.length);
}
