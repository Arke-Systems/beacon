import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';
import type { ContentType } from '../content-types/Types.js';
import type { Entry } from './Types.js';

export interface LocaleInfo {
	readonly code: string;
	readonly fallback_locale?: string;
	readonly name: string;
	readonly uid: string;
}

function isLocaleInfoRecord(o: unknown): o is Record<string, unknown> {
	return isRecord(o) && typeof o.code === 'string';
}

/**
 * Retrieves all available locale versions of an entry from Contentstack.
 *
 * This function queries the Contentstack Management API to get a list of all locales
 * in which the specified entry exists. This is used during pull operations to determine
 * which locale versions need to be exported and saved to the filesystem.
 *
 * @param client - The Contentstack API client
 * @param contentTypeUid - The UID of the content type (e.g., 'event', 'home_page')
 * @param entryUid - The UID of the entry to get locales for
 * @returns A readonly array of LocaleInfo objects, each containing the locale code, name, and UID
 * @throws {ContentstackError} If the API returns an error
 * @throws {Error} If the response cannot be parsed as a valid LocalesResponse
 *
 * @example
 * const locales = await getEntryLocales(client, 'event', 'blt123456');
 * // Returns: [
 * //   { code: 'en-us', name: 'English - United States', uid: 'blt...' },
 * //   { code: 'fr', name: 'French', uid: 'blt...' }
 * // ]
 */
export default async function getEntryLocales(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entryUid: Entry['uid'],
): Promise<readonly LocaleInfo[]> {
	const { data, error } = await client.GET(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}/locales',
		{
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entryUid,
				},
			},
		},
	);

	const msg = `Failed to get locales for ${contentTypeUid} entry: ${entryUid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isRecord(result)) {
		throw new Error(msg);
	}

	const raw = result.locales;
	if (!Array.isArray(raw)) {
		throw new Error(msg);
	}

	const normalized: LocaleInfo[] = raw.map((item) => {
		const rec = isLocaleInfoRecord(item)
			? item
			: ({ code: '' } as Record<string, unknown>);
		const code = typeof rec.code === 'string' ? rec.code : '';
		const name = typeof rec.name === 'string' ? rec.name : code;
		const uid = typeof rec.uid === 'string' ? rec.uid : code;

		// Only include `fallback_locale` when present as a string. Construct
		// the object with the correct shape so TypeScript can verify it against
		// `LocaleInfo` without unsafe casts.
		const locale =
			typeof rec.fallback_locale === 'string'
				? { code, fallback_locale: rec.fallback_locale, name, uid }
				: { code, name, uid };

		return locale;
	});

	return normalized;
}
