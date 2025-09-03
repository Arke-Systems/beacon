import type { Item } from '#cli/cs/Types.js';
import duplicateItemHandler from './duplicateItemHandler.js';

export default function createAccumulator<TItem extends Item>(
	pluralNoun: string,
	keyFn: (item: TItem) => string,
	equality: (a: TItem, b: TItem) => boolean,
) {
	const acc = new Map<string, TItem>();

	const handleDuplicateItems = (key: string, item: TItem) =>
		duplicateItemHandler(pluralNoun, acc, equality, key, item);

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
