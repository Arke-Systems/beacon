export default interface MergePlan<TItem> {
	readonly toCreate: ReadonlyMap<string, TItem>;
	readonly toRemove: ReadonlyMap<string, TItem>;
	readonly toSkip: ReadonlySet<string>;
	readonly toUpdate: ReadonlyMap<string, TItem>;
}
