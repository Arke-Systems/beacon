export default interface TransferResults {
	readonly created: ReadonlySet<string>;
	readonly updated: ReadonlySet<string>;
	readonly deleted: ReadonlySet<string>;
	readonly unmodified: ReadonlySet<string>;
	readonly errored: ReadonlyMap<string, unknown>;
}

export class MutableTransferResults implements TransferResults {
	public readonly created = new Set<string>();
	public readonly updated = new Set<string>();
	public readonly deleted = new Set<string>();
	public readonly unmodified = new Set<string>();
	public readonly errored = new Map<string, unknown>();
}
