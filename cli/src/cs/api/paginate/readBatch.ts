import type { Item } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';
import ContentstackError from '../ContentstackError.js';
import retryWithBackoff from '../retryWithBackoff.js';
import type ApiResponse from './ApiResponse.js';
import type Batch from './Batch.js';

const HTTP_TOO_MANY_REQUESTS = 429;

export default async function readBatch<TItem extends Item>(
	pluralNoun: string,
	fetchFn: (skip: number) => Promise<ApiResponse>,
	mapFn: (data: Record<string, unknown>) => Batch<TItem>,
	skip = 0,
): Promise<Batch<TItem>> {
	// Retry with exponential backoff for rate limit errors
	const { data, error } = await retryWithBackoff(
		async () => {
			const response = await fetchFn(skip);
			// Check for rate limit errors and throw them for retry handling
			if (
				response.error &&
				typeof response.error === 'object' &&
				'error_code' in response.error &&
				response.error.error_code === HTTP_TOO_MANY_REQUESTS
			) {
				// Throw as an Error object for proper error handling
				const err = new Error('Rate limit exceeded');
				Object.assign(err, response.error);
				throw err;
			}
			return response;
		},
		{
			initialDelay: 2000, // Start with 2s for CI environments
			maxAttempts: 5,
			maxDelay: 60000, // Cap at 60s
		},
	);

	ContentstackError.throwIfError(error, `Failed to get ${pluralNoun}`);

	if (!isRecord(data)) {
		throw new Error('Invalid response from Contentstack');
	}

	return mapFn(data);
}
