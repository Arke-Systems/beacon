import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import type OmitIndex from '#cli/util/OmitIndex.js';

type EntryUpdate = OmitIndex<Entry> & Record<string, unknown>;

export default async function updateEntry(
	client: Client,
	content_type_uid: string,
	{ uid: entry_uid, ...entry }: EntryUpdate,
) {
	const { error } = await client.PUT(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
		{
			body: { entry },
			params: { path: { content_type_uid, entry_uid } },
		},
	);

	const msg = `Failed to update test entry: ${entry_uid}`;
	ContentstackError.throwIfError(error, msg);
}
