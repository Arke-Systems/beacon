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

interface LocalesResponse {
	readonly locales: readonly LocaleInfo[];
}

function isLocaleInfo(o: unknown): o is LocaleInfo {
	return (
		isRecord(o) &&
		typeof o.code === 'string' &&
		typeof o.name === 'string' &&
		typeof o.uid === 'string'
	);
}

function isLocalesResponse(o: unknown): o is LocalesResponse {
	return (
		isRecord(o) && Array.isArray(o.locales) && o.locales.every(isLocaleInfo)
	);
}

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

	if (!isLocalesResponse(result)) {
		throw new Error(msg);
	}

	return result.locales;
}
