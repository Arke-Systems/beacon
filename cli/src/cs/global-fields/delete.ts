import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteGlobalField(client: Client, uid: string) {
	const { error, response } = await client.DELETE(
		'/v3/global_fields/{global_field_uid}',
		{
			params: {
				path: { global_field_uid: uid },
				query: { force: 'true' },
			},
		},
	);

	const msg = `Failed to delete global field: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
