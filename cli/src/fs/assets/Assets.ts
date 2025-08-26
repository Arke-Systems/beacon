import { resolve } from 'node:path';
import type FolderMeta from '../../schema/assetFolders/lib/FolderMeta.js';
import type AssetMeta from '../../schema/assets/AssetMeta.js';
import { load } from '../../schema/assets/lib/MetaSerialization.js';
import {
	assetPaths,
	formatItemPath,
} from '../../schema/assets/lib/NamingConvention.js';
import schemaDirectory from '../../schema/assets/schemaDirectory.js';
import tryReadDir from '../tryReadDir.js';

export default class Assets {
	private constructor(
		private readonly _assetsByPath: Map<string, AssetMeta>,
		private readonly _foldersByPath: Map<string, FolderMeta>,
	) {}

	public get assetsByPath(): ReadonlyMap<string, AssetMeta> {
		return this._assetsByPath;
	}

	public get foldersByPath(): ReadonlyMap<string, FolderMeta> {
		return this._foldersByPath;
	}

	public static async create() {
		const assetsPath = schemaDirectory();
		const assetsByPath = new Map<string, AssetMeta>();
		const foldersByPath = new Map<string, FolderMeta>();
		const entries = await tryReadDir(assetsPath, true);

		for (const paths of assetPaths(assetsPath, entries)) {
			const meta = await load(paths);
			assetsByPath.set(meta.itemPath, meta);
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}

			const absPath = resolve(entry.parentPath, entry.name);
			const itemPath = formatItemPath(assetsPath, absPath);
			foldersByPath.set(itemPath, { itemPath, name: entry.name });
		}

		return new Assets(assetsByPath, foldersByPath);
	}
}
