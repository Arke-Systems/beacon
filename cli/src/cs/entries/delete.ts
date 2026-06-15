import isRecord from '#cli/util/isRecord.js';
import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

const EntryNotFound = 141;

export default async function deleteEntry(
	client: Client,
	contentTypeUid: string,
	entryUid: string,
	deleteAllLocalized = true,
	locale?: string,
): Promise<{ deleted: boolean; notFound: boolean }> {
	const result = await client.DELETE(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
		{
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entryUid,
				},
				query: {
					...(deleteAllLocalized ? { delete_all_localized: 'true' } : {}),
					...(locale ? { locale } : {}),
				},
			},
		},
	);

	const msg = `Failed to delete ${contentTypeUid} entry: ${entryUid}`;
	const error = result.error as unknown;

	if (isRecord(error) && error.error_code === EntryNotFound) {
		// Entry not found - might be orphaned/corrupted
		return { deleted: false, notFound: true };
	}

	ContentstackError.throwIfError(error, msg);

	if (!result.response.ok) {
		throw new Error(msg);
	}

	return { deleted: true, notFound: false };
}
