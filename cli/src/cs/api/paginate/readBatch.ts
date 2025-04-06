import type { Item } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';
import ContentstackError from '../ContentstackError.js';
import type ApiResponse from './ApiResponse.js';
import type Batch from './Batch.js';

export default async function readBatch<TItem extends Item>(
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
