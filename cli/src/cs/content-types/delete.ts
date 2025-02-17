import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteContentType(client: Client, uid: string) {
	const { error, response } = await client.DELETE(
		'/v3/content_types/{content_type_uid}',
		{
			params: {
				path: { content_type_uid: uid },
				query: { force: 'true' },
			},
		},
	);

	const msg = `Failed to delete content type: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
