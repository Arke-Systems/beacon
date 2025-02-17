import type MergePlan from './MergePlan.js';

export default function planMerge<TItem>(
	equality: (a: TItem, b: TItem) => boolean,
	source: ReadonlyMap<string, TItem>,
	destination: ReadonlyMap<string, TItem>,
): MergePlan<TItem> {
	const toCreate = new Map<string, TItem>();
	const toUpdate = new Map<string, TItem>();
	const toSkip = new Set<string>();

	const toRemove = [...destination]
		.filter(([key]) => !source.has(key))
		.reduce((acc, [key, item]) => acc.set(key, item), new Map<string, TItem>());

	for (const [uid, item] of source) {
		const existing = destination.get(uid);

		if (existing) {
			if (equality(item, existing)) {
				toSkip.add(uid);
			} else {
				toUpdate.set(uid, item);
			}
		} else {
			toCreate.set(uid, item);
		}
	}

	return { toCreate, toRemove, toSkip, toUpdate };
}
