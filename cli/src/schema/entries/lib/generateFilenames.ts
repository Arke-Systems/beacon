import type { Entry } from '#cli/cs/entries/Types.js';
import sanitize from 'sanitize-filename';

// This function generates a list of unique filenames for all entries, based
// on the outputs of the sanitizeFilenames function. It then disambiguates the
// filenames by appending a number to the end of each filename that is not
// already unique.
export default function generateFilenames(
	entriesByTitle: ReadonlyMap<Entry['title'], Entry>,
): ReadonlyMap<Entry['uid'], string> {
	const { byFilename, byTitle } = sanitizeFilenames(entriesByTitle);
	const result = new Map<string, string>();

	for (const title of entriesByTitle.keys()) {
		const filename = byTitle.get(title);

		if (!filename) {
			throw new Error(`No filename for entry ${title}`);
		}

		const lc = filename.toLowerCase();
		const siblings = byFilename.get(lc) ?? new Set<Entry['title']>();

		if (siblings.size === 1) {
			result.set(title, filename + '.yaml');
			continue;
		}

		const sorted = [...siblings].sort();

		const idx = sorted.indexOf(title);
		if (idx === -1) {
			throw new Error(`No index for entry ${title}`);
		}

		result.set(title, `${filename} (${(idx + 1).toLocaleString()}).yaml`);
	}

	return result;
}

// This creates a map of sanitized filenames to sets of entry titles.
//
// This is to deal with the possibility that two entries have titles that
// sanitize to the same filename. We need to detect all of these cases so that
// the filenames can be disambiguated.
function sanitizeFilenames(
	entriesByTitle: ReadonlyMap<Entry['title'], Entry>,
): {
	readonly byFilename: ReadonlyMap<string, ReadonlySet<Entry['title']>>;
	readonly byTitle: ReadonlyMap<Entry['title'], string>;
} {
	const byFilename = new Map<string, Set<Entry['title']>>();
	const byTitle = new Map<Entry['title'], string>();

	for (const entry of entriesByTitle.values()) {
		const sanitized = sanitizeFilename(entry.title);
		const lc = sanitized.toLowerCase();
		const existing = byFilename.get(lc);

		if (existing) {
			existing.add(entry.title);
		} else {
			byFilename.set(lc, new Set([entry.title]));
		}

		byTitle.set(entry.title, sanitized);
	}

	return { byFilename, byTitle };
}

function sanitizeFilename(name: string): string {
	const raw = name.trim();
	const sanitized = sanitize(raw, { replacement: '_' });
	return sanitized.trim() || 'Untitled';
}
