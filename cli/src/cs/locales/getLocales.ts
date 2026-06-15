import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';

export interface Locale {
	readonly code: string;
	readonly fallback_locale?: string;
	readonly name: string;
	readonly uid: string;
}

/**
 * Fetches all locales configured for a stack.
 */
export async function getLocales(client: Client): Promise<readonly Locale[]> {
	const response = await client.GET('/v3/locales', {});

	const msg = 'Failed to fetch locales';
	ContentstackError.throwIfError(response.error, msg);

	if (!response.response.ok) {
		throw new Error(msg);
	}

	const { data } = response;

	if (!isRecord(data)) {
		throw new TypeError(msg);
	}

	const { locales } = data;

	if (!Array.isArray(locales)) {
		throw new TypeError(msg);
	}

	return locales as Locale[];
}
