import type MergePlan from '#cli/schema/xfer/lib/MergePlan.js';
import { isDeepStrictEqual } from 'node:util';
import getUi from '../../lib/SchemaUi.js';
import type AssetMeta from '../AssetMeta.js';

export default function planPull(
	cs: ReadonlyMap<string, AssetMeta>,
	fs: ReadonlyMap<string, AssetMeta>,
): MergePlan<AssetMeta> {
	const ui = getUi();
	const { isIncluded } = ui.options.schema.assets;

	const { result, seen } = processCsAssets(cs, fs, isIncluded);
	processFsAssets(fs, isIncluded, { result, seen });

	return result;
}

function processCsAssets(
	cs: ReadonlyMap<string, AssetMeta>,
	fs: ReadonlyMap<string, AssetMeta>,
	isIncluded: (path: string) => boolean,
) {
	const result = {
		toCreate: new Map<string, AssetMeta>(),
		toRemove: new Map<string, AssetMeta>(),
		toSkip: new Set<string>(),
		toUpdate: new Map<string, AssetMeta>(),
	};

	const seen = new Set<string>();

	for (const [path, csMeta] of cs) {
		seen.add(path);
		const fsMeta = fs.get(path);

		if (fsMeta) {
			if (isIncluded(path)) {
				if (isDeepStrictEqual(csMeta, fsMeta)) {
					result.toSkip.add(path);
				} else {
					result.toUpdate.set(path, csMeta);
				}
			} else {
				result.toSkip.add(path);
			}
		} else if (isIncluded(path)) {
			result.toCreate.set(path, csMeta);
		} else {
			result.toSkip.add(path);
		}
	}

	return { result, seen };
}

function processFsAssets(
	fs: ReadonlyMap<string, AssetMeta>,
	isIncluded: (path: string) => boolean,
	{ result, seen }: ReturnType<typeof processCsAssets>,
) {
	for (const [path, fsMeta] of fs) {
		if (seen.has(path)) {
			continue;
		}

		if (isIncluded(path)) {
			result.toRemove.set(path, fsMeta);
		} else {
			result.toSkip.add(path);
		}
	}
}
