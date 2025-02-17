import type { ReadonlyAssets } from '#cli/cs/assets/Assets.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import type AssetMeta from '../AssetMeta.js';
import { fromRawAsset } from '../AssetMeta.js';
import resolveItemPath from './resolveItemPath.js';

export default function loadMetaCs(
	assets: ReadonlyAssets,
): ReadonlyMap<string, AssetMeta> {
	const result = new Map<string, AssetMeta>();
	const allAssets = [...assets.descendantOrSelf(null)].filter(isRawAsset);

	for (const asset of allAssets) {
		const itemPath = resolveItemPath(assets.byUid, asset);
		result.set(itemPath, fromRawAsset(asset, itemPath));
	}

	return result;
}
