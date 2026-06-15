import type Assets from '#cli/cs/assets/Assets.js';
import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import { resolve } from 'node:path';
import type AssetMeta from '../AssetMeta.js';

async function ensureParentFolderExists(
	csState: Assets,
	folderPath: string,
): Promise<string | null> {
	if (!folderPath) {
		return null;
	}

	// Check if folder already exists
	const existing = resolveRawAssetItem(csState.byParentUid, folderPath);
	if (existing) {
		return existing.uid;
	}

	// Get parent path and ensure parent folder exists
	const pathSegments = folderPath.split('/');
	const folderName = pathSegments[pathSegments.length - 1];

	if (!folderName) {
		throw new Error(`Invalid folder path: ${folderPath}`);
	}

	const parentPath = pathSegments.slice(0, -1).join('/');

	const parentUid = await ensureParentFolderExists(csState, parentPath);

	// Create this folder
	const created = await csState.createFolder(folderName, parentUid);
	return created.uid;
}

export default async function writeAssetToContentstack(
	csState: Assets,
	assetsPath: string,
	meta: AssetMeta,
) {
	// Check if asset already exists (prevents duplicates from timeout retries)
	const existing = resolveRawAssetItem(csState.byParentUid, meta.itemPath);
	if (existing && isRawAsset(existing)) {
		// Asset already exists - likely from a previous attempt that timed out
		// but still created the asset. Return the existing asset to avoid duplicates.
		return existing;
	}

	const parentPath = meta.itemPath.split('/').slice(0, -1).join('/');

	// Ensure parent folder exists (create if missing)
	const parentUid = await ensureParentFolderExists(csState, parentPath);

	const filePath = resolve(assetsPath, meta.itemPath);

	return csState.createAsset({
		filePath,
		...(typeof meta.description === 'string'
			? { description: meta.description }
			: {}),

		...(meta.tags.size > 0 ? { tags: [...meta.tags] } : {}),
		...(typeof meta.title === 'string' ? { title: meta.title } : {}),
		...(parentUid ? { parent_uid: parentUid } : {}),
	});
}
