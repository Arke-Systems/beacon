import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry, ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import type EntryCollection from '#cli/schema/entries/EntryCollection.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';

export default class ReferenceReplacer {
	readonly #refPath: ReferencePath;
	readonly #entries: EntryCollection;

	public constructor(ctx: Ctx, refPath: ReferencePath) {
		this.#refPath = refPath;
		this.#entries = ctx.cs.entries;
	}

	public process(schema: SchemaField, value: unknown) {
		return schema.data_type === 'reference'
			? this.#replaceReferences(value)
			: value;
	}

	#replaceReferences(value: unknown) {
		if (value === null) {
			return;
		}

		if (!Array.isArray(value)) {
			const y = createStylus('yellowBright');
			const msg1 = y`Expected references in entry ${this.#refPath}`;
			const msg2 = y`to be an array, but found: ${typeof value}:`;
			getUi().warn(msg1, msg2, value);
			return value;
		}

		return value
			.map(this.#replaceReference.bind(this))
			.filter((x) => x !== null);
	}

	#replaceReference(value: unknown, idx: number) {
		if (!isReference(value)) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.#refPath} contains an unexpected reference`;
			const msg2 = y`data structure at index ${idx.toLocaleString()}:`;
			getUi().warn(msg1, msg2, value);
			return value;
		}

		const referencedPath = `${value._content_type_uid}/${value.uid}` as const;
		const referencedEntry = this.#entries.byTypedUid.get(referencedPath);

		if (!referencedEntry) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.#refPath} references ${referencedPath},`;
			const msg2 = 'which does not exist. The invalid reference will be';
			const msg3 = 'removed.';
			getUi().warn(msg1, msg2, msg3);
			return null;
		}

		const { title } = referencedEntry;
		const reference: ReferencePath = `${value._content_type_uid}/${title}`;
		return { $beacon: { reference } };
	}
}

interface Reference {
	readonly uid: Entry['uid'];
	readonly _content_type_uid: ContentType['uid'];
}

function isReference(value: unknown): value is Reference {
	return (
		isRecord(value) &&
		typeof value.uid === 'string' &&
		typeof value._content_type_uid === 'string'
	);
}
