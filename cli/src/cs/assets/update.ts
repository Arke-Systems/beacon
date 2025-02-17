import isRecord from '#cli/util/isRecord.js';
import type Client from '../api/Client.js';
import type { operations } from '../api/cma-openapi-3.js';
import ContentstackError from '../api/ContentstackError.js';
import assetBody from './lib/assetBody.js';
import { isRawAsset, type RawAsset } from './Types.js';

type MutableFields = 'description' | 'parent_uid' | 'tags' | 'title';
type Operation = operations['uploadasset'];
type Body = Operation['requestBody']['content']['multipart/form-data'];

type UpdatedAsset = Partial<Pick<RawAsset, MutableFields>> &
	Pick<RawAsset, 'uid'> & {
		readonly filePath?: string;
	};

export default async function update(client: Client, updated: UpdatedAsset) {
	const body = await assetBody(updated);

	const { data, error, response } = await client.PUT('/v3/assets/{asset_uid}', {
		// as unknown as Body because the typing in the OpenAPI spec gets
		// tricky with FormData
		body: body as unknown as Body,
		params: { path: { asset_uid: updated.uid } },
	});

	const msg = `Failed to update asset: ${updated.uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}

	const result = data as unknown;

	if (!isRecord(result)) {
		throw new Error(msg);
	}

	const { asset } = result;

	if (!isRawAsset(asset)) {
		throw new Error(msg);
	}

	return asset;
}
