import type Client from '#cli/cs/api/Client.js';
import { StatusCodes } from 'http-status-codes';

export default async function assetExists(client: Client, assetUid: string) {
	const { response } = await client.GET('/v3/assets/{asset_uid}', {
		params: { path: { asset_uid: assetUid } },
	});

	return response.status === (StatusCodes.OK as number);
}
