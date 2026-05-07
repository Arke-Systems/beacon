import { resolve } from 'node:path';
import type FolderMeta from '../../schema/assetFolders/lib/FolderMeta.js';
import type AssetMeta from '../../schema/assets/AssetMeta.js';
import { load } from '../../schema/assets/lib/MetaSerialization.js';
import {
	assetPaths,
	formatItemPath,
} from '../../schema/assets/lib/NamingConvention.js';
import normalizeFolderName from '../../schema/assets/lib/normalizeFolderName.js';
import schemaDirectory from '../../schema/assets/schemaDirectory.js';
import getUi from '../../schema/lib/SchemaUi.js';
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

	public static async createIfIncluded() {
		// Check if assets are excluded - if so, return empty collection
		// without reading from disk
		const ui = getUi();
		const { isIncluded } = ui.options.schema.assets;

		// Test a few common paths to see if assets are included.
		// We need to check if the filter could potentially include files,
		// not if specific hardcoded paths are included.
		// To detect a filter that excludes everything, we test several paths
		// AND check if the directory exists with files.
		const testPaths = ['test.jpg', 'assets/test.png', 'folder/file.pdf'];
		const hasAnyIncluded = testPaths.some(isIncluded);

		if (!hasAnyIncluded) {
			// None of the test paths matched. Check if there are actual files
			// on disk that might be included before deciding to skip loading.
			const assetsPath = schemaDirectory();
			const entries = await tryReadDir(assetsPath, true);

			// If there are actual asset files, we need to load and check them
			// against the filter, as the filter might include files we haven't
			// tested with our hardcoded paths.
			const hasAssetFiles =
				assetPaths(assetsPath, entries).next().done === false;

			if (!hasAssetFiles) {
				// No asset files on disk, safe to return empty collection
				return new Assets(new Map(), new Map());
			}
		}

		return this.create();
	}

	public static async create() {
		const assetsPath = schemaDirectory();
		const assetsByPath = new Map<string, AssetMeta>();
		const foldersByPath = new Map<string, FolderMeta>();
		const entries = await tryReadDir(assetsPath, true);
		const ui = getUi();
		const { isIncluded } = ui.options.schema.assets;

		for (const paths of assetPaths(assetsPath, entries)) {
			// Skip excluded assets - don't even validate their metadata
			if (!isIncluded(paths.itemPath)) {
				continue;
			}

			try {
				const meta = await load(paths);
				assetsByPath.set(meta.itemPath, meta);
			} catch (error) {
				// Skip assets where the blob file is missing (ENOENT error)
				// The load() function already logged a warning
				if (
					error &&
					typeof error === 'object' &&
					'code' in error &&
					error.code === 'ENOENT'
				) {
					continue;
				}
				// Re-throw other errors
				throw error;
			}
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}

			const absPath = resolve(entry.parentPath, entry.name);
			const rawItemPath = formatItemPath(assetsPath, absPath);
			// Normalize folder names to replace spaces with underscores
			// Split path, normalize each segment, rejoin
			const itemPath = rawItemPath
				.split('/')
				.map(normalizeFolderName)
				.join('/');
			const normalizedName = normalizeFolderName(entry.name);
			foldersByPath.set(itemPath, { itemPath, name: normalizedName });
		}

		return new Assets(assetsByPath, foldersByPath);
	}
}
