import { rm } from 'node:fs/promises';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import processPlan from '../xfer/lib/processPlan.js';
import type AssetMeta from './AssetMeta.js';
import loadMetaCs from './lib/loadMetaCs.js';
import { getBlobPath, getMetaPath } from './lib/NamingConvention.js';
import planPull from './lib/planPull.js';
import writeAssetToFileSystem from './lib/writeAssetToFileSystem.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toFilesystem(ctx: Ctx) {
	const assetsPath = schemaDirectory();
	const write = writeAssetToFileSystem.bind(null, ctx.cs.assets, assetsPath);
	const fs = ctx.fs.assets.assetsByPath;
	const cs = loadMetaCs(ctx.cs.assets);
	using bar = createProgressBar('Assets', cs, fs);

	return await processPlan<AssetMeta>({
		create: write,
		deletionStrategy: 'delete',
		plan: planPull(cs, fs),
		progress: bar,
		remove: removeAsset.bind(null, assetsPath),
		update: write,
	});
}

async function removeAsset(assetsPath: string, { itemPath }: AssetMeta) {
	const blobPath = getBlobPath(assetsPath, itemPath);
	const metaPath = getMetaPath(assetsPath, itemPath);
	const ui = getUi();

	for (const path of [blobPath, metaPath]) {
		try {
			await rm(path);
		} catch (ex) {
			if (ex instanceof Error) {
				if ('code' in ex && ex.code === 'ENOENT') {
					continue;
				}

				ui.warn(`Failed to remove ${path}:`, ex.message);
				continue;
			}

			ui.warn(`Failed to remove ${path}:`, ex);
		}
	}
}
