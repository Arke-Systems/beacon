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

export function merge(
	a: Partial<TransferResults>,
	b: Partial<TransferResults>,
): TransferResults {
	const merged = new MutableTransferResults();

	function* keysIn(key: Exclude<keyof TransferResults, 'errored'>) {
		for (const x of a[key] ?? []) {
			yield x;
		}

		for (const x of b[key] ?? []) {
			yield x;
		}
	}

	for (const key of keysIn('unmodified')) {
		merged.unmodified.add(key);
	}

	for (const key of keysIn('updated')) {
		merged.updated.add(key);
		merged.unmodified.delete(key);
	}

	for (const key of keysIn('created')) {
		merged.created.add(key);
		merged.updated.delete(key);
		merged.unmodified.delete(key);
	}

	for (const key of keysIn('deleted')) {
		merged.deleted.add(key);
		merged.created.delete(key);
		merged.updated.delete(key);
		merged.unmodified.delete(key);
	}

	for (const [key, err] of [...(a.errored ?? []), ...(b.errored ?? [])]) {
		merged.errored.set(key, err);
		merged.created.delete(key);
		merged.updated.delete(key);
		merged.unmodified.delete(key);
		merged.deleted.delete(key);
	}

	return merged;
}
