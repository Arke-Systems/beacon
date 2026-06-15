import type { Entry } from '#cli/cs/entries/Types.js';
import readSerializedData from '#cli/fs/readSerializedData.js';
import { getSupportedExtensions } from '#cli/fs/serializationFormat.js';
import escapeRegex from '#cli/util/escapeRegex.js';
import { extname, parse } from 'node:path';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface EntryWithLocale {
	readonly entry: Entry;
	readonly locale: string;
}

/**
 * Sort locale entries to ensure 'default' locale comes first, followed by 'en-us',
 * then all others. This is critical because Contentstack requires creating
 * entries in the default locale before adding additional locale versions.
 */
function sortLocaleEntries(
	results: readonly EntryWithLocale[],
): readonly EntryWithLocale[] {
	return [...results].sort((a, b) => {
		if (a.locale === 'default') {
			return -1;
		}
		if (b.locale === 'default') {
			return 1;
		}
		if (a.locale === 'en-us' || a.locale === 'en') {
			return -1;
		}
		if (b.locale === 'en-us' || b.locale === 'en') {
			return 1;
		}
		return a.locale.localeCompare(b.locale);
	});
}

/**
 * Loads all locale versions of an entry from the filesystem.
 *
 * This function supports both single-locale and multi-locale file patterns:
 * - Single-locale: `baseFilename.yaml` (assigns locale='default' for backward compatibility)
 * - Multi-locale: `baseFilename.{locale}.yaml` (e.g., `Entry Title.en-us.yaml`)
 *
 * @param directory - The directory containing entry files (e.g., 'schema/entries/event')
 * @param entryTitle - The title of the entry (used to create synthetic uid for filesystem entries)
 * @param baseFilename - The base filename without extension (e.g., 'Entry Title')
 * @returns An array of entry objects with their locale codes. Returns empty array if directory doesn't exist.
 *
 * @example
 * // For files: Entry.en-us.yaml, Entry.fr.yaml
 * const locales = await loadEntryLocales('./entries/event', 'Entry', 'Entry');
 * // Returns: [
 * //   { entry: {...}, locale: 'en-us' },
 * //   { entry: {...}, locale: 'fr' }
 * // ]
 *
 * @example
 * // For single file: Entry.yaml
 * const locales = await loadEntryLocales('./entries/event', 'Entry', 'Entry');
 * // Returns: [{ entry: {...}, locale: 'default' }]
 */
export default async function loadEntryLocales(
	directory: string,
	entryTitle: Entry['title'],
	baseFilename: string,
): Promise<readonly EntryWithLocale[]> {
	const results: EntryWithLocale[] = [];

	try {
		const files = await readdir(directory);
		const supportedExtensions = getSupportedExtensions();

		for (const file of files) {
			const ext = extname(file).toLowerCase();
			if (!supportedExtensions.includes(ext)) {
				continue;
			}

			const localeEntry = await tryLoadLocaleFile(
				file,
				directory,
				entryTitle,
				baseFilename,
			);

			if (localeEntry) {
				results.push(localeEntry);
			}
		}
	} catch (error) {
		if (isDirectoryNotFoundError(error)) {
			return [];
		}
		throw error;
	}

	return sortLocaleEntries(results);
}

function createMultiLocalePattern(baseFilename: string, ext: string): RegExp {
	// Escape the extension (e.g., .yaml -> \.yaml, .json -> \.json)
	const escapedExt = escapeRegex(ext);
	return new RegExp(
		`^${escapeRegex(baseFilename)}\\.([^.]+)${escapedExt}$`,
		'u',
	);
}

async function tryLoadLocaleFile(
	file: string,
	directory: string,
	entryTitle: string,
	baseFilename: string,
): Promise<EntryWithLocale | null> {
	const ext = extname(file);
	const fileBasename = parse(file).name;
	const multiLocalePattern = createMultiLocalePattern(baseFilename, ext);

	const match = file.match(multiLocalePattern);
	if (match) {
		const [, locale] = match;
		if (!locale) {
			return null;
		}

		const entry = await loadEntryFile(directory, file, entryTitle);
		return { entry, locale };
	}

	// Single locale file: baseFilename.ext
	if (fileBasename === baseFilename) {
		const entry = await loadEntryFile(directory, file, entryTitle);
		return { entry, locale: 'default' };
	}

	return null;
}

async function loadEntryFile(
	directory: string,
	file: string,
	entryTitle: string,
): Promise<Entry> {
	const filePath = resolve(directory, file);
	const data = (await readSerializedData(filePath)) as Record<string, unknown>;

	return {
		...data,
		uid: `file: ${entryTitle}`,
	} as Entry;
}

function isDirectoryNotFoundError(error: unknown): boolean {
	return (
		error !== null &&
		typeof error === 'object' &&
		'code' in error &&
		error.code === 'ENOENT'
	);
}
