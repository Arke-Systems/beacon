import type MergePlan from '#cli/schema/xfer/lib/MergePlan.js';
import type UiContext from '#cli/ui/UiContext.js';
import { isDeepStrictEqual, styleText } from 'node:util';
import getUi from '../../lib/SchemaUi.js';
import type AssetMeta from '../AssetMeta.js';

export default function planPush(
	cs: ReadonlyMap<string, AssetMeta>,
	fs: ReadonlyMap<string, AssetMeta>,
): MergePlan<AssetMeta> {
	const fsResult = processFsItems(cs, fs);
	const csResult = processCsItems(cs, fsResult.seen);

	return {
		toCreate: fsResult.toCreate,
		toRemove: csResult.toRemove,
		toSkip: new Set([...fsResult.toSkip, ...csResult.toSkip]),
		toUpdate: fsResult.toUpdate,
	};
}

function warning(ui: UiContext, itemPath: string) {
	const msg1 = 'Skipping asset which exists in the file system,';
	const msg2 = 'but is not included by filters:';
	const msg3 = styleText('yellowBright', itemPath);
	ui.warn(msg1, msg2, msg3);
}

function processFsItems(
	cs: ReadonlyMap<string, AssetMeta>,
	fs: ReadonlyMap<string, AssetMeta>,
) {
	const seen = new Set<string>();
	const ui = getUi();
	const { isIncluded } = ui.options.schema.assets;
	const toCreate = new Map<string, AssetMeta>();
	const toSkip = new Set<string>();
	const toUpdate = new Map<string, AssetMeta>();

	for (const [itemPath, fsMeta] of fs) {
		seen.add(itemPath);
		const csMeta = cs.get(itemPath);

		if (csMeta) {
			if (isIncluded(itemPath)) {
				if (isDeepStrictEqual(csMeta, fsMeta)) {
					toSkip.add(itemPath);
				} else {
					toUpdate.set(itemPath, fsMeta);
				}
			} else {
				warning(ui, itemPath);
				toSkip.add(itemPath);
			}
		} else if (isIncluded(itemPath)) {
			toCreate.set(itemPath, fsMeta);
		} else {
			warning(ui, itemPath);
			toSkip.add(itemPath);
		}
	}

	return { seen, toCreate, toSkip, toUpdate };
}

function processCsItems(
	cs: ReadonlyMap<string, AssetMeta>,
	seenItems: ReadonlySet<string>,
) {
	const ui = getUi();
	const { isIncluded } = ui.options.schema.assets;
	const toRemove = new Map<string, AssetMeta>();
	const toSkip = new Set<string>();

	for (const [itemPath, csMeta] of cs) {
		if (seenItems.has(itemPath)) {
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
