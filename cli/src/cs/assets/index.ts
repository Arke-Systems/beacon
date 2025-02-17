import type Client from '../api/Client.js';
import readPaginatedItems from '../api/readPaginatedItems.js';
import typecheckArray from '../typecheckArray.js';
import { itemKey } from '../Types.js';
import type { RawAssetItem } from './Types.js';
import { isRawAssetItem } from './Types.js';

export default async function index(
	client: Client,
): Promise<ReadonlyMap<string, RawAssetItem>> {
	return readPaginatedItems<RawAssetItem>(
		'assets',
		itemKey,
		fetchFn.bind(null, client),
		mapFn,
	);
}

function mapFn(data: Record<string, unknown>) {
	const { assets: items, count } = data;

	if (!typecheckArray(isRawAssetItem, 'assets', items)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items,
		...(typeof count === 'number' ? { count } : {}),
	};
}

async function fetchFn(client: Client, skip: number) {
	const query: {
		include_folders: 'true';
		include_count?: 'true';
		skip?: number;
	} = { include_folders: 'true' };

	if (skip) {
		query.skip = skip;
	} else {
		query.include_count = 'true';
	}

	return client.GET('/v3/assets', {
		params: { query },
	});
}
