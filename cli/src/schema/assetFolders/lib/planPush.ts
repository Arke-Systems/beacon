import type MergePlan from '#cli/schema/xfer/lib/MergePlan.js';
import type UiContext from '#cli/ui/UiContext.js';
import { styleText } from 'node:util';
import type AssetMeta from '../../assets/AssetMeta.js';
import getUi from '../../lib/SchemaUi.js';
import type FolderMeta from './FolderMeta.js';

export default function planPush(
	cs: ReadonlyMap<string, FolderMeta>,
	fsFolders: ReadonlyMap<string, FolderMeta>,
	fsAssets: ReadonlyMap<string, AssetMeta>,
): MergePlan<FolderMeta> {
	const fsResult = processFsItems(cs, fsFolders, fsAssets);
	const csResult = processCsItems(cs, fsResult.seen);

	return {
		toCreate: fsResult.toCreate,
		toRemove: csResult.toRemove,
		toSkip: new Set([...fsResult.toSkip, ...csResult.toSkip]),
		toUpdate: new Map(),
	};
}

function hasIncludedChildren(
	isIncluded: (path: string) => boolean,
	keys: Iterable<string>,
	itemPath: string,
) {
	for (const otherItemPath of keys) {
		if (!otherItemPath.startsWith(itemPath + '/')) {
			continue;
		}

		if (isIncluded(otherItemPath)) {
			return true;
		}
	}

	return false;
}

function* allKeys(
	fsFolders: ReadonlyMap<string, FolderMeta>,
	fsAssets: ReadonlyMap<string, AssetMeta>,
) {
	for (const itemPath of fsFolders.keys()) {
		yield itemPath;
	}

	for (const itemPath of fsAssets.keys()) {
		if (fsFolders.has(itemPath)) {
			continue;
		}

		yield itemPath;
	}
}

function warning(ui: UiContext, itemPath: string) {
	const msg1 = 'Skipping folder which exists in the file system,';
	const msg2 = 'but is not included by filters, and contains no';
	const msg3 = 'included children:';
	const msg4 = styleText('yellowBright', itemPath);
	ui.warn(msg1, msg2, msg3, msg4);
}

function processFsItems(
	cs: ReadonlyMap<string, FolderMeta>,
	fsFolders: ReadonlyMap<string, FolderMeta>,
	fsAssets: ReadonlyMap<string, AssetMeta>,
) {
	const ui = getUi();
	const { isIncluded } = ui.options.schema.assets;
	const keys = allKeys.bind(null, fsFolders, fsAssets);
	const hasChildren = (x: string) => hasIncludedChildren(isIncluded, keys(), x);
	const seen = new Set<string>();
	const toCreate = new Map<string, FolderMeta>();
	const toSkip = new Set<string>();

	for (const [itemPath, fsMeta] of fsFolders) {
		seen.add(itemPath);
		const csMeta = cs.get(itemPath);

		if (csMeta) {
			toSkip.add(itemPath);

			if (!isIncluded(itemPath) && !hasChildren(itemPath)) {
				warning(ui, itemPath);
			}

			continue;
		}

		if (isIncluded(itemPath)) {
			toCreate.set(itemPath, fsMeta);
			continue;
		}

		if (hasChildren(itemPath)) {
			toCreate.set(itemPath, fsMeta);
		} else {
			toSkip.add(itemPath);
			warning(ui, itemPath);
		}
	}

	return { seen, toCreate, toSkip };
}

function processCsItems(
	cs: ReadonlyMap<string, FolderMeta>,
	seen: ReadonlySet<string>,
) {
	const ui = getUi();
	const { isIncluded } = ui.options.schema.assets;
	const toRemove = new Map<string, FolderMeta>();
	const toSkip = new Set<string>();

	for (const [itemPath, csMeta] of cs) {
		if (seen.has(itemPath)) {
			continue;
		}

		if (isIncluded(itemPath)) {
			toRemove.set(itemPath, csMeta);
		} else {
			toSkip.add(itemPath);
		}
	}

	return { toRemove, toSkip };
}
