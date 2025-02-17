import type { Entry } from '#cli/cs/entries/Types.js';
import isRecord from '#cli/util/isRecord.js';

// There are several fields on entries that we have limited control over,
// and that are not stable across import/export operations.
//
// We wish to avoid considering these fields any time we compare two entries.
//
// This is used when determining entry equality.
//
// Also, we use this set to remove fields from the serialized versions of
// entries before saving them to the file system, so we do not clutter git
// histories with inconsequential changes.
const topLevelBlacklist: ReadonlySet<string> = new Set<string>([
	'_in_progress', // Don't know what this does, seems to be an internal field.
	'_version', // Versions change with every import/export and are not stable.
	'ACL', // Read/Import/Export APIs return different values for this field.
	'created_at', // Reflects date of last import, not actual creation date.
	'created_by', // Reflects user who ran import, not actual creator.
	'uid', // Mutates if an entry is deleted and re-created.
	'updated_at', // Reflects date of last import, not actual update date.
	'updated_by', // Reflects user who ran import, not actual updater.
]);

const subLevelBlacklist: ReadonlySet<string> = new Set<string>(['_metadata']);

export default function normalize(entry: Entry) {
	return Object.fromEntries(
		Object.entries(entry).filter(notIn(topLevelBlacklist)).map(normalizeKvP),
	);
}

function normalizeKvP([key, value]: [string, unknown]): [string, unknown] {
	return [key, normalizeValue(value)];
}

function normalizeValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(normalizeValue);
	}

	if (isRecord(value)) {
		return Object.fromEntries(
			Object.entries(value).filter(notIn(subLevelBlacklist)).map(normalizeKvP),
		);
	}

	return value;
}

function notIn(list: ReadonlySet<string>) {
	return ([key]: [string, unknown]) => !list.has(key);
}
