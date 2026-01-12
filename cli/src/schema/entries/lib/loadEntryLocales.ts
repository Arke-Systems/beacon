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
	return new RegExp(
		`^${baseFilename.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\.([^.]+)\\.yaml$`,
		'u',
	);
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
