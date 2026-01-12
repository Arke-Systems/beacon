import type { Entry } from '#cli/cs/entries/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface EntryWithLocale {
	readonly entry: Entry;
	readonly locale: string;
}

export default async function loadEntryLocales(
	directory: string,
	entryTitle: Entry['title'],
	baseFilename: string,
): Promise<readonly EntryWithLocale[]> {
	const results: EntryWithLocale[] = [];

	try {
		const files = await readdir(directory);
		const multiLocalePattern = new RegExp(
			`^${baseFilename.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\.([^.]+)\\.yaml$`,
			'u',
		);
		const singleLocaleFilename = `${baseFilename}.yaml`;

		for (const file of files) {
			// Try multi-locale pattern first
			const match = file.match(multiLocalePattern);
			if (match) {
				const [, locale] = match;
				if (!locale) {
					continue;
				}

				const filePath = resolve(directory, file);
				const data = (await readYaml(filePath)) as Record<string, unknown>;

				// Add a synthetic uid for filesystem entries
				const entry = {
					...data,
					uid: `file: ${entryTitle}`,
				} as Entry;

				results.push({ entry, locale });
			} else if (file === singleLocaleFilename) {
				// Handle simple format (no locale suffix) for backward compatibility
				const filePath = resolve(directory, file);
				const data = (await readYaml(filePath)) as Record<string, unknown>;

				// Add a synthetic uid for filesystem entries
				const entry = {
					...data,
					uid: `file: ${entryTitle}`,
				} as Entry;

				// Use 'default' as locale for single-locale files
				results.push({ entry, locale: 'default' });
			}
		}
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			// Directory doesn't exist
			return [];
		}
		throw error;
	}

	return results;
}
