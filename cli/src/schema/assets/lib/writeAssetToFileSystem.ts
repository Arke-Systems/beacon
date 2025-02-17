import type { ReadonlyAssets } from '#cli/cs/assets/Assets.js';
import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type AssetMeta from '../AssetMeta.js';
import { save } from './MetaSerialization.js';
import { getBlobPath } from './NamingConvention.js';

export default async function writeAssetToFileSystem(
	assets: ReadonlyAssets,
	assetsPath: string,
	asset: AssetMeta,
) {
	const { itemPath } = asset;
	const rawAsset = resolveRawAssetItem(assets.byParentUid, itemPath);
	if (!isRawAsset(rawAsset)) {
		throw new Error(`Could not find raw asset for ${itemPath}`);
	}

	await Promise.all([
		downloadFile(rawAsset.url, getBlobPath(assetsPath, itemPath)),
		save(assetsPath, asset),
	]);
}

async function downloadFile(url: string, destination: string) {
	const { body } = await fetch(url);

	if (!body) {
		throw new Error(`Failed to download ${url}`);
	}

	await mkdir(dirname(destination), { recursive: true });
	const fileStream = createWriteStream(destination);
	await pipeline(body, fileStream);
}
