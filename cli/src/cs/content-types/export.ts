import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import { isSchema } from '../Types.js';

export default async function exportContentType(client: Client, uid: string) {
	const { data, error } = await client.GET(
		'/v3/content_types/{content_type_uid}/export',
		{
			params: {
				path: { content_type_uid: uid },
			},
		},
	);

	const msg = `Failed to export content type: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isSchema(result)) {
		throw new Error(msg);
	}

	return result;
}
