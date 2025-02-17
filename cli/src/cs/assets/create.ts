import isRecord from '#cli/util/isRecord.js';
import type Client from '../api/Client.js';
import type { operations } from '../api/cma-openapi-3.js';
import ContentstackError from '../api/ContentstackError.js';
import assetBody from './lib/assetBody.js';
import type { RawAsset } from './Types.js';
import { isRawAsset } from './Types.js';

type SettableFields = 'description' | 'parent_uid' | 'tags' | 'title';
type Operation = operations['uploadasset'];
type Body = Operation['requestBody']['content']['multipart/form-data'];

type NewAsset = Partial<Pick<RawAsset, SettableFields>> & {
	readonly filePath: string;
};

export default async function create(client: Client, newAsset: NewAsset) {
	const body = await assetBody(newAsset);

	const { data, error, response } = await client.POST('/v3/assets', {
		// as unknown as Body because the typing in the OpenAPI spec gets
		// tricky with FormData
		body: body as unknown as Body,
	});

	const msg = `Failed to create asset: ${newAsset.filePath}`;
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
