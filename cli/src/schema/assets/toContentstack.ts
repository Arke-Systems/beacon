import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import updateAsset from '#cli/cs/assets/update.js';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import processPlan from '../xfer/lib/processPlan.js';
import type AssetMeta from './AssetMeta.js';
import loadMetaCs from './lib/loadMetaCs.js';
import planPush from './lib/planPush.js';
import writeAssetToContentstack from './lib/writeAssetToContentstack.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();
	const assetsPath = schemaDirectory();

	await mkdir(assetsPath, { recursive: true });
	const fsMeta = ctx.fs.assets.assetsByPath;
	const csMeta = loadMetaCs(ctx.cs.assets);
	using bar = createProgressBar('Assets', csMeta, fsMeta);

	const create = async (meta: AssetMeta) =>
		writeAssetToContentstack(ctx.cs.assets, assetsPath, meta);

	return await processPlan({
		create,
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan: planPush(csMeta, fsMeta),
		progress: bar,
		remove: async (asset) => ctx.cs.assets.deleteAsset(asset.itemPath),
		update: async (meta) => update(ctx, csMeta, assetsPath, meta),
	});
}

async function update(
	ctx: Ctx,
	csMeta: ReadonlyMap<string, AssetMeta>,
	assetsPath: string,
	updatedMeta: AssetMeta,
) {
	const currentCsMeta = csMeta.get(updatedMeta.itemPath);

	const currentRawItem = resolveRawAssetItem(
		ctx.cs.assets.byParentUid,
		updatedMeta.itemPath,
	);

	if (!currentCsMeta || !currentRawItem) {
		throw new Error('Asset not found in Contentstack: ' + updatedMeta.itemPath);
	}

	const updatedItemPath = resolve(assetsPath, updatedMeta.itemPath);

	return updateAsset(ctx.cs.client, {
		description: updatedMeta.description,
		tags: [...updatedMeta.tags],
		title: updatedMeta.title,
		uid: currentRawItem.uid,
		...(currentCsMeta.fileSize === updatedMeta.fileSize
			? {}
			: { filePath: updatedItemPath }),
	});
}
