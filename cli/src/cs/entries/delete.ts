import isRecord from '#cli/util/isRecord.js';
import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

const EntryNotFound = 141;

export default async function deleteEntry(
	client: Client,
	contentTypeUid: string,
	entryUid: string,
) {
	const result = await client.DELETE(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
		{
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entryUid,
				},
			},
		},
	);

	const msg = `Failed to delete ${contentTypeUid} entry: ${entryUid}`;
	const error = result.error as unknown;

	if (isRecord(error) && error.error_code === EntryNotFound) {
		// Safe to ignore
		return;
	}

	ContentstackError.throwIfError(error, msg);

	if (!result.response.ok) {
		throw new Error(msg);
	}
}
