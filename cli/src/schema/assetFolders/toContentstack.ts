import type Assets from '#cli/cs/assets/Assets.js';
import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { mkdir } from 'node:fs/promises';
import schemaDirectory from '../assets/schemaDirectory.js';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import processPlan from '../xfer/lib/processPlan.js';
import type FolderMeta from './lib/FolderMeta.js';
import indexDestination from './lib/indexContentstack.js';
import planPush from './lib/planPush.js';

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();
	const assetsPath = schemaDirectory();
	await mkdir(assetsPath, { recursive: true });

	// Indexes of both source and destination must be in order. Depth-first or
	// breadth-first doesn't matter, so long as no child ever comes before its
	// parent.
	const source = ctx.fs.assets.foldersByPath;
	const destination = indexDestination(ctx.cs.assets);
	using bar = createProgressBar('Asset Folders', source, destination);

	return await processPlan<FolderMeta>({
		create: create.bind(null, ctx.cs.assets),
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan: planPush(destination, source, ctx.fs.assets.assetsByPath),
		progress: bar,
		remove: tryDeleteFolder.bind(null, ctx.cs.assets),
		update: () => {
			throw new Error('Not implemented');
		},
	});
}

async function create(assets: Assets, meta: FolderMeta) {
	const parentPath = meta.itemPath.split('/').slice(0, -1).join('/');
	const parent = resolveRawAssetItem(assets.byParentUid, parentPath);

	if (parentPath && !parent) {
		throw new Error(`Parent folder not found: ${parentPath}`);
	}

	await assets.createFolder(meta.name, parent?.uid ?? null);
}

async function tryDeleteFolder(assets: Assets, meta: FolderMeta) {
	const item = resolveRawAssetItem(assets.byParentUid, meta.itemPath);

	if (!item) {
		// Probably already deleted because deleting a parent also deletes all
		// descendants.
		return;
	}

	await assets.deleteFolder(item.uid);
}
