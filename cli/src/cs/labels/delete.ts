import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteLabel(
	client: Client,
	labelUid: string,
): Promise<void> {
	const { error, response } = await client.DELETE('/v3/labels/{label_uid}', {
		params: { path: { label_uid: labelUid } },
	});

	const msg = `Failed to delete label: ${labelUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
