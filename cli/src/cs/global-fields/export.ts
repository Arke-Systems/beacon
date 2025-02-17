import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import { isSchema } from '../Types.js';

export default async function exportGlobalField(client: Client, uid: string) {
	const { data, error } = await client.GET(
		'/v3/global_fields/{global_field_uid}/export',
		{ params: { path: { global_field_uid: uid } } },
	);

	const msg = `Failed to export global field: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isSchema(result)) {
		throw new Error(msg);
	}

	return result;
}
