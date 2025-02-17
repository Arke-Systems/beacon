import type { RawAssetItem } from '../Types.js';

export default function indexByParent(
	byUid: ReadonlyMap<string, RawAssetItem>,
): ReadonlyMap<string | null, ReadonlySet<RawAssetItem>> {
	const byParentId = new Map<string | null, Set<RawAssetItem>>();

	for (const item of byUid.values()) {
		const parentId = item.parent_uid;
		const existing = byParentId.get(parentId);

		if (existing) {
			existing.add(item);
		} else {
			byParentId.set(parentId, new Set([item]));
		}
	}

	return byParentId;
}
