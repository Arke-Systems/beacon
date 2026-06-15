import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { isEntry } from '#cli/cs/entries/Types.js';
import readSerializedData from '#cli/fs/readSerializedData.js';
import { getSupportedExtensions } from '#cli/fs/serializationFormat.js';
import type OmitIndex from '#cli/util/OmitIndex.js';
import { readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import indexContentTypes from '../content-types/indexFromFilesystem.js';
import getUi from '../lib/SchemaUi.js';
import schemaDirectory from './schemaDirectory.js';

const MIN_PARTS_FOR_LOCALE = 2;

export default async function indexAllFsEntries(): Promise<
	ReadonlyMap<ContentType, ReadonlySet<Entry>>
> {
	const contentTypes = await indexContentTypes();
	const entries = new Map<ContentType, ReadonlySet<Entry>>();

	for (const contentType of contentTypes.values()) {
		const contentTypeEntries = await loadContentTypeEntries(contentType);
		entries.set(contentType, contentTypeEntries);
	}

	return entries;
}

async function loadContentTypeEntries(
	contentType: ContentType,
): Promise<ReadonlySet<Entry>> {
	const dir = schemaDirectory(contentType.uid);
	const entriesSet = new Set<Entry>();

	try {
		const files = await readdir(dir);
		const supportedExtensions = getSupportedExtensions();
		const dataFiles = files.filter((f) => {
			const ext = extname(f).toLowerCase();
			return supportedExtensions.includes(ext);
		});

		const entriesByTitle = await groupEntriesByTitle(dir, dataFiles);

		// For each entry title, pick one locale version to represent it
		for (const [entryTitle, localeMap] of entriesByTitle.entries()) {
			const preferredEntry = selectPreferredLocale(localeMap);
			if (preferredEntry) {
				// Always use synthetic UID based on title for filesystem entries.
				// This ensures entries are matched by title, not UID, since UIDs
				// from the filesystem may not match server UIDs after pull/push cycles.
				const uid = `file: ${entryTitle}`;
				// Omit any uid field from the entry to prevent conflicts
				const { uid: _omittedUid, ...entryWithoutUid } = preferredEntry;
				entriesSet.add({
					...entryWithoutUid,
					title: entryTitle, // Use filename-based title for consistency
					uid,
				});
			} else {
				// Log warning if entry has files but no valid locale versions
				getUi().warn(
					`Warning: Entry "${entryTitle}" in ${contentType.uid} has files but no valid locale versions could be selected`,
				);
			}
		}
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			// Directory doesn't exist, which is fine
			return entriesSet;
		}

		throw error;
	}

	return entriesSet;
}

function parseFileNameForLocale(
	file: string,
): { entryTitle: string; locale: string } | null {
	const ext = extname(file);
	if (!ext) return null;

	const baseName = file.slice(0, -ext.length);

	// Try to match multi-locale pattern first: title.locale.ext
	const parts = baseName.split('.');
	if (parts.length >= MIN_PARTS_FOR_LOCALE) {
		const possibleLocale = parts[parts.length - 1];
		if (possibleLocale && isValidLocaleCode(possibleLocale)) {
			// Multi-locale file with valid locale code
			const title = parts.slice(0, -1).join('.');
			return { entryTitle: title, locale: possibleLocale };
		}
	}

	// Single-locale pattern: title.ext
	return {
		entryTitle: baseName,
		locale: 'default', // Use 'default' as locale for backward compatibility
	};
}

async function groupEntriesByTitle(
	dir: string,
	dataFiles: readonly string[],
): Promise<Map<string, Map<string, FsEntry>>> {
	const entriesByTitle = new Map<string, Map<string, FsEntry>>();

	for (const file of dataFiles) {
		const parsed = parseFileNameForLocale(file);
		if (!parsed) {
			continue;
		}

		const { entryTitle, locale } = parsed;

		const filePath = resolve(dir, file);
		const data = (await readSerializedData(filePath)) as Record<
			string,
			unknown
		>;

		if (!isFsEntry(data)) {
			continue;
		}

		let localeMap = entriesByTitle.get(entryTitle);
		if (!localeMap) {
			localeMap = new Map();
			entriesByTitle.set(entryTitle, localeMap);
		}

		localeMap.set(locale, data);
	}

	return entriesByTitle;
}

function selectPreferredLocale(
	localeMap: Map<string, FsEntry>,
): FsEntry | undefined {
	// Prefer 'default' (single-locale file), then en-us, then the first available locale
	return (
		localeMap.get('default') ??
		localeMap.get('en-us') ??
		[...localeMap.values()][0]
	);
}

type FsEntry = Omit<OmitIndex<Entry>, 'uid'> & Record<string, unknown>;

function isFsEntry(o: Record<string, unknown>): o is FsEntry {
	return isEntry({ ...o, uid: 'uid' });
}

/**
 * Validates if a string is a valid locale code.
 * Valid locale codes contain only letters (case-insensitive), hyphens, and underscores.
 * Examples: en-us, fr, de-DE, zh_CN
 * This prevents misidentifying filenames like "Entry.Title.yaml" as "Entry" with locale "Title"
 */
function isValidLocaleCode(code: string): boolean {
	// Locale codes: 2-3 letter language code, optionally followed by separator and 2-4 letter region code
	// Pattern matches: en, en-us, en-US, fr-CA, zh_CN, etc.
	return /^[a-z]{2,3}(?:[_-][a-z]{2,4})?$/iu.test(code);
}
