import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';

export interface ReadonlyEntryCollection {
	// readonly byPath: ReadonlyMap<ReferencePath, Entry>;

	// When Contentstack serializes an entry that contains references, those
	// references are stored as:
	//
	//   ref: { uid: bltc0ddae0dc0eb1e8d, _content_type_uid: site_header }
	//
	// This structure provdies uid values for both entries and content types.
	//
	// The entry uid values are not stable across stacks, so when we store this
	// in the file system, we store it as:
	//
	//   ref: site_header/entry-title
	//
	// The `byTypedUid` index lets us quickly map a content type uid and an entry
	// uid into the entry object (which can be used to find the entry title).
	readonly byTypedUid: ReadonlyMap<
		`${ContentType['uid']}/${Entry['uid']}`,
		Entry
	>;

	// When comparing entries between the file system and Contentstack, we match
	// entries on their title (since the uid values are not stable across stacks).
	// This index lets us quickly locate a specific entry by its title, within the
	// context of a given content type.
	byTitleFor(
		contentTypeUid: ContentType['uid'],
	): ReadonlyMap<Entry['title'], Entry>;
}

export default class EntryCollection implements ReadonlyEntryCollection {
	readonly #byTypedUid = new Map<
		`${ContentType['uid']}/${Entry['uid']}`,
		Entry
	>();

	readonly #byTitle = new Map<ContentType['uid'], Map<Entry['title'], Entry>>();

	public constructor(initial: ReadonlyMap<ContentType, ReadonlySet<Entry>>) {
		for (const [contentType, entries] of initial) {
			const byTitle = new Map<Entry['title'], Entry>();

			for (const entry of entries) {
				this.#byTypedUid.set(`${contentType.uid}/${entry.uid}`, entry);
				byTitle.set(entry.title, entry);
			}

			this.#byTitle.set(contentType.uid, byTitle);
		}
	}

	public get byTypedUid(): ReadonlyMap<
		`${ContentType['uid']}/${Entry['uid']}`,
		Entry
	> {
		return this.#byTypedUid;
	}

	public byTitleFor(
		contentTypeUid: ContentType['uid'],
	): ReadonlyMap<Entry['title'], Entry> {
		return this.#byTitle.get(contentTypeUid) ?? new Map();
	}

	public set(contentTypeUid: ContentType['uid'], entry: Entry) {
		const uidPath = `${contentTypeUid}/${entry.uid}` as const;
		const previous = this.#byTypedUid.get(uidPath);
		this.#byTypedUid.set(uidPath, entry);

		const byTitle = this.#byTitle.get(contentTypeUid);

		if (byTitle) {
			if (previous && previous.title !== entry.title) {
				byTitle.delete(previous.title);
			}

			byTitle.set(entry.title, entry);
		} else {
			this.#byTitle.set(contentTypeUid, new Map([[entry.title, entry]]));
		}
	}
}
