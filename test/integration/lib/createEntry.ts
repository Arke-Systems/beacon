import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { randomUUID } from 'node:crypto';

export default async function createEntry(
	client: Client,
	contentTypeUid: ContentType['uid'],
): Promise<AsyncDisposable & Entry> {
	const title = randomUUID();

	const response = await client.POST(
		'/v3/content_types/{content_type_uid}/entries',
		{
			body: { entry: { title } },

			params: {
				path: { content_type_uid: contentTypeUid },
			},
		},
	);

	const msg = 'Failed to create test entry';
	ContentstackError.throwIfError(response.error, msg);

	const data = response.data as unknown as {
		readonly notice: string;
		readonly entry: Entry;
	};

	const { uid } = data.entry;

	return {
		...data.entry,
		async [Symbol.asyncDispose]() {
			return deleteEntry(client, contentTypeUid, uid);
		},
	};
}
