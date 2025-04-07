import type { Item } from '#cli/cs/Types.js';

// Items is a _filtered_ list. We occasionally see:
//
//   - Entries with no data, in which all fields (including the title)
//     are empty.
//
//   - Duplicate entries, in which all fields including the uid are identical.
//
// The `mapFn` parameter is responsible for filtering out these items and
// returning this `Batch` object. The `items` property has invalid items
// removed, but the `processedItemCount` property must include a count of
// _all_ items so that we can paginate propertly.
export default interface Batch<TItem extends Item> {
	readonly count?: number;
	readonly items: readonly TItem[];
	readonly processedItemCount?: number;
}
