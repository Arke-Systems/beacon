import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteAsset(client: Client, uid: string) {
	const { error, response } = await client.DELETE('/v3/assets/{asset_uid}', {
		params: { path: { asset_uid: uid } },
	});

	const msg = `Failed to delete asset: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
