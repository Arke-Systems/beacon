import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type { ContentType } from '../content-types/Types.js';
import type { Entry } from './Types.js';
import { isEntry } from './Types.js';

export default async function exportEntry(
	contentTypeUid: ContentType['uid'],
	client: Client,
	entryUid: Entry['uid'],
) {
	const { data, error } = await client.GET(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}/export',
		{
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entryUid,
				},
			},
		},
	);

	const msg = `Failed to export ${contentTypeUid} entry: ${entryUid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isEntry(result)) {
		throw new Error(msg);
	}

	return result;
}
