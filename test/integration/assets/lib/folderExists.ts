import type Client from '#cli/cs/api/Client.js';
import { StatusCodes } from 'http-status-codes';

export default async function folderExists(client: Client, folderUid: string) {
	const { response } = await client.GET('/v3/assets/folders/{folder_uid}', {
		params: { path: { folder_uid: folderUid } },
	});

	return response.status === (StatusCodes.OK as number);
}
