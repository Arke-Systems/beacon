export default interface MergePlan<TItem> {
	readonly toCreate: ReadonlyMap<string, TItem>;
	readonly toRemove: ReadonlyMap<string, TItem>;
	readonly toSkip: ReadonlyMap<string, TItem>;
	readonly toUpdate: ReadonlyMap<string, TItem>;
}
