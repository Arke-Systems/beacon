import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Label from './Label.js';

export default async function update(
	client: Client,
	label: Label,
): Promise<void> {
	const { uid, ...rest } = label;

	const { error, response } = await client.PUT('/v3/labels/{label_uid}', {
		body: { label: rest },
		params: { path: { label_uid: uid } },
	});

	const msg = `Failed to update label: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
