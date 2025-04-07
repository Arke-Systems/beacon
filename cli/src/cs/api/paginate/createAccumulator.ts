import type { Item } from '#cli/cs/Types.js';
import duplicateItemHandler from './duplicateItemHandler.js';

export default function createAccumulator<TItem extends Item>(
	pluralNoun: string,
	keyFn: (item: TItem) => string,
) {
	const acc = new Map<string, TItem>();
	const handleDuplicateItems = duplicateItemHandler.bind(null, pluralNoun, acc);

	return {
		add(items: readonly TItem[]) {
			for (const item of items) {
				const key = keyFn(item);
				handleDuplicateItems(key, item);
				acc.set(key, item);
			}
		},
		get result(): ReadonlyMap<string, TItem> {
			return acc;
		},
	};
}
