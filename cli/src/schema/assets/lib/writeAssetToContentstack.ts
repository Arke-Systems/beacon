import type Assets from '#cli/cs/assets/Assets.js';
import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { resolve } from 'node:path';
import type AssetMeta from '../AssetMeta.js';

export default async function writeAssetToContentstack(
	csState: Assets,
	assetsPath: string,
	meta: AssetMeta,
) {
	const parentPath = meta.itemPath.split('/').slice(0, -1).join('/');
	const parent = resolveRawAssetItem(csState.byParentUid, parentPath);

	if (parentPath && !parent) {
		throw new Error('Parent folder not found: ' + parentPath);
	}

	const filePath = resolve(assetsPath, meta.itemPath);

	return csState.createAsset({
		filePath,
		...(typeof meta.description === 'string'
			? { description: meta.description }
			: {}),

		...(meta.tags.size > 0 ? { tags: [...meta.tags] } : {}),
		...(typeof meta.title === 'string' ? { title: meta.title } : {}),
		...(parent ? { parent_uid: parent.uid } : {}),
	});
}
