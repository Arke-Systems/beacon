import type { ContentType } from '#cli/cs/content-types/Types.js';
import parseReferencePath from '#cli/cs/entries/parseReferencePath.js';
import type { Entry, ReferencePath } from '#cli/cs/entries/Types.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';

export default interface ReadonlyReferenceMap {
	readonly missed: number;
	entriesWithMissedReferences(): Iterable<readonly [ContentType['uid'], Entry]>;
	findReferencedUid(from: ReferencePath, to: ReferencePath): string;
}

// This is just a placeholder value that intentionally doesn't match any
// valid entry. It's used to indicate that the reference is missing.
const placeholderUid = 'blt3d92b0cffbed654c';

export class ReferenceMap implements ReadonlyReferenceMap {
	#missed = 0;
	readonly #byPath = new Map<ReferencePath, Entry>();

	readonly #byTypedUid = new Map<
		`${ContentType['uid']}/${Entry['uid']}`,
		ReferencePath
	>();

	readonly #missedReferences = new Map<ReferencePath, Set<ReferencePath>>();

	public get missed() {
		return this.#missed;
	}

	public *entriesWithMissedReferences() {
		for (const [from, missed] of this.#missedReferences) {
			if (missed.size === 0) {
				continue;
			}

			const entry = this.#byPath.get(from);
			if (!entry) {
				continue;
			}

			const { contentTypeUid } = parseReferencePath(from);
			yield [contentTypeUid, entry] as const;
		}
	}

	public findReferencedUid(from: ReferencePath, to: ReferencePath) {
		const existing = this.#byPath.get(to);

		if (existing) {
			return existing.uid;
		}

		this.#addMissedReference(from, to);
		return placeholderUid;
	}

	public recordEntryForReferences(
		contentTypeUid: ContentType['uid'],
		entry: Entry,
	) {
		const entryPath: ReferencePath = `${contentTypeUid}/${entry.title}`;
		this.#byPath.set(entryPath, entry);
		this.#byTypedUid.set(`${contentTypeUid}/${entry.uid}`, entryPath);
	}

	public seal(): ReadonlyReferenceMap {
		return {
			entriesWithMissedReferences: this.entriesWithMissedReferences.bind(this),

			findReferencedUid: (from: ReferencePath, to: ReferencePath) => {
				const existing = this.#byPath.get(to);

				if (!existing) {
					const y = createStylus('yellowBright');
					throw new HandledError(y`Missing reference: ${from} -> ${to}`);
				}

				return existing.uid;
			},

			missed: this.missed,
		};
	}

	#addMissedReference(from: ReferencePath, to: ReferencePath) {
		const missing = this.#missedReferences.get(from);

		this.#missed += 1;

		if (missing) {
			missing.add(to);
		} else {
			this.#missedReferences.set(from, new Set([to]));
		}
	}
}
