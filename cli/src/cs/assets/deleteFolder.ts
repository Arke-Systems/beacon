import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteFolder(
	client: Client,
	folderUid: string,
): Promise<void> {
	const { error, response } = await client.DELETE(
		'/v3/assets/folders/{folder_uid}',
		{ params: { path: { folder_uid: folderUid } } },
	);

	const msg = `Failed to delete asset folder: ${folderUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
