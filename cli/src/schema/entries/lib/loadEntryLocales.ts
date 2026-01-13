import type { Entry } from '#cli/cs/entries/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import escapeRegex from '#cli/util/escapeRegex.js';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface EntryWithLocale {
	readonly entry: Entry;
	readonly locale: string;
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
		const multiLocalePattern = createMultiLocalePattern(baseFilename);
		const singleLocaleFilename = `${baseFilename}.yaml`;

		for (const file of files) {
			const localeEntry = await tryLoadLocaleFile(
				file,
				directory,
				entryTitle,
				multiLocalePattern,
				singleLocaleFilename,
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

	return results;
}

function createMultiLocalePattern(baseFilename: string): RegExp {
	return new RegExp(`^${escapeRegex(baseFilename)}\\.([^.]+)\\.yaml$`, 'u');
}

async function tryLoadLocaleFile(
	file: string,
	directory: string,
	entryTitle: string,
	multiLocalePattern: RegExp,
	singleLocaleFilename: string,
): Promise<EntryWithLocale | null> {
	const match = file.match(multiLocalePattern);
	if (match) {
		const [, locale] = match;
		if (!locale) {
			return null;
		}

		const entry = await loadEntryFile(directory, file, entryTitle);
		return { entry, locale };
	}

	if (file === singleLocaleFilename) {
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
	const data = (await readYaml(filePath)) as Record<string, unknown>;

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
