import type { RawAssetItem } from '../Types.js';
import { isRawAsset } from '../Types.js';

export default function resolveRawAssetItem(
	byParent: ReadonlyMap<string | null, ReadonlySet<RawAssetItem>>,
	itemPath: string,
): RawAssetItem | undefined {
	const path = itemPath.split('/');
	const name = path.pop();
	const parentPath = path.join('/');

	const parent = parentPath
		? (resolveRawAssetItem(byParent, parentPath) ?? null)
		: null;

	for (const child of byParent.get(parent?.uid ?? null) ?? []) {
		if (isRawAsset(child)) {
			if (child.filename === name) {
				return child;
			}
		} else if (child.name === name) {
			return child;
		}
	}
}
