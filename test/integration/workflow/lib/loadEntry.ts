import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Item } from '#cli/cs/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export default async function loadEntry(
	dir: string,
	contentTypeUid: ContentType['uid'],
	name: string,
) {
	const entriesDir = resolve(dir, 'entries', contentTypeUid);

	// Try loading simple format first (backward compatibility)
	const simplePath = resolve(entriesDir, `${name}.yaml`);
	try {
		return (await readYaml(simplePath)) as Item;
	} catch (simpleError) {
		// If simple format doesn't exist, try finding locale-specific file
		try {
			const files = await readdir(entriesDir);
			const pattern = new RegExp(`^${escapeRegex(name)}\\.[^.]+\\.yaml$`, 'u');
			const localeFile = files.find((f) => pattern.test(f));

			if (localeFile) {
				return (await readYaml(resolve(entriesDir, localeFile))) as Item;
			}
		} catch {
			// Directory might not exist, fall through to throw original error
		}

		// If neither exists, throw the original error
		throw simpleError;
	}
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
