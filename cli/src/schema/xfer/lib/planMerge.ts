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

	for (const [key, item] of source) {
		const existing = destination.get(key);

		if (existing) {
			if (equality(item, existing)) {
				toSkip.add(key);
			} else {
				toUpdate.set(key, item);
			}
		} else {
			toCreate.set(key, item);
		}
	}

	return { toCreate, toRemove, toSkip, toUpdate };
}
