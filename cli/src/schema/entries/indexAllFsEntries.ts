import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { isEntry } from '#cli/cs/entries/Types.js';
import type OmitIndex from '#cli/util/OmitIndex.js';
import indexContentTypes from '../content-types/indexFromFilesystem.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
import schemaDirectory from './schemaDirectory.js';

export default async function indexAllFsEntries(
	isIncluded: (contentTypeUid: string) => boolean = () => true,
): Promise<ReadonlyMap<ContentType, ReadonlySet<Entry>>> {
	const contentTypes = await indexContentTypes();
	const entries = new Map<ContentType, ReadonlySet<Entry>>();

	for (const contentType of contentTypes.values()) {
		const x = new Set<Entry>();
		entries.set(contentType, x);
		if (!isIncluded(contentType.uid)) {
			continue;
		}

		const dir = schemaDirectory(contentType.uid);
		const raw = await indexFromFilesystem(dir, isFsEntry, key);

		for (const entry of raw.values()) {
			x.add({ ...entry, uid: `file: ${entry.title}` });
		}
	}

	return entries;
}

type FsEntry = Omit<OmitIndex<Entry>, 'uid'> & Record<string, unknown>;

function isFsEntry(o: Record<string, unknown>): o is FsEntry {
	return isEntry({ ...o, uid: 'uid' });
}

function key(o: FsEntry): string {
	return o.title;
}
