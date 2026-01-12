import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { isEntry } from '#cli/cs/entries/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import type OmitIndex from '#cli/util/OmitIndex.js';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import indexContentTypes from '../content-types/indexFromFilesystem.js';
import getUi from '../lib/SchemaUi.js';
import schemaDirectory from './schemaDirectory.js';

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
		const yamlFiles = files.filter((f) => f.endsWith('.yaml'));
		const entriesByTitle = await groupEntriesByTitle(dir, yamlFiles);

		// For each entry title, pick one locale version to represent it
		for (const [entryTitle, localeMap] of entriesByTitle.entries()) {
			const preferredEntry = selectPreferredLocale(localeMap);
			if (preferredEntry) {
				entriesSet.add({
					...preferredEntry,
					uid: `file: ${preferredEntry.title}`,
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

async function groupEntriesByTitle(
	dir: string,
	yamlFiles: readonly string[],
): Promise<Map<string, Map<string, FsEntry>>> {
	const entriesByTitle = new Map<string, Map<string, FsEntry>>();

	for (const file of yamlFiles) {
		// Try to match multi-locale pattern first: title.locale.yaml
		const multiLocaleMatch = /^(?<title>.+)\.(?<locale>[^.]+)\.yaml$/u.exec(
			file,
		);

		let entryTitle: string;
		let locale: string;

		if (
			multiLocaleMatch?.groups?.title &&
			multiLocaleMatch.groups.locale &&
			isValidLocaleCode(multiLocaleMatch.groups.locale)
		) {
			// Multi-locale file with valid locale code
			const { title, locale: localeCode } = multiLocaleMatch.groups;
			entryTitle = title;
			locale = localeCode;
		} else {
			// Try single-locale pattern: title.yaml
			const singleLocaleMatch = /^(?<title>.+)\.yaml$/u.exec(file);
			if (!singleLocaleMatch?.groups?.title) {
				// Skip files that don't match either pattern
				continue;
			}
			entryTitle = singleLocaleMatch.groups.title;
			locale = 'default'; // Use 'default' as locale for backward compatibility
		}

		const filePath = resolve(dir, file);
		const data = (await readYaml(filePath)) as Record<string, unknown>;

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
