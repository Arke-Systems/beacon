import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Item } from '#cli/cs/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import escapeRegex from '#cli/util/escapeRegex.js';
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
	} catch (simpleError: unknown) {
		// If simple format doesn't exist, try finding locale-specific file
		try {
			const files = await readdir(entriesDir);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- escapeRegex is properly typed as (string) => string
			const escapedName: string = escapeRegex(name);
			const localeFile = files.find((f) => {
				const pattern = new RegExp(
					`^${escapedName}\\.(?<locale>[^.]+)\\.yaml$`,
					'u',
				);
				const match = pattern.exec(f);
				return match?.groups?.locale && isValidLocaleCode(match.groups.locale);
			});

			if (localeFile) {
				return (await readYaml(resolve(entriesDir, localeFile))) as Item;
			}
		} catch {
			// Directory might not exist, fall through to throw original error
		}

		// If neither exists, throw the original error

		if (simpleError instanceof Error) {
			throw simpleError;
		}
		throw new Error('Failed to load entry', { cause: simpleError });
	}
}

function isValidLocaleCode(code: string): boolean {
	// Locale codes: 2-3 letter language code, optionally followed by separator and 2-4 letter region code
	// Pattern matches: en, en-us, en-US, fr-CA, zh_CN, etc.
	return /^[a-z]{2,3}(?:[_-][a-z]{2,4})?$/iu.test(code);
}
