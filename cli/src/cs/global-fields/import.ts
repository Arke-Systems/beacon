import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import fileUploadInit from '../api/fileUploadInit.js';
import type { Schema } from '../Types.js';

export default async function importGlobalField(
	client: Client,
	overwrite: boolean,
	schema: Schema,
) {
	// "overwrite" is undocumented but works. If left out, updates report an
	// error prompting for its use.
	const query: Record<string, unknown> = {
		...(overwrite ? { overwrite: 'true' } : {}),
	};

	const { error, response } = await client.POST('/v3/global_fields/import', {
		...fileUploadInit,
		body: { global_field: JSON.stringify(schema) },
		params: { query },
	});

	const msg = `Failed to import global field: ${schema.uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
