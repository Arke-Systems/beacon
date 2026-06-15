import type Client from '../api/Client.js';
import { addLocale } from './addLocale.js';
import { getLocales } from './getLocales.js';
import type { Locale } from './getLocales.js';

/**
 * Ensures a locale exists in the target stack. If it doesn't exist, creates it.
 * @param client - Contentstack API client
 * @param localeCode - Locale code to ensure exists (e.g., 'zh-cn')
 * @param fallbackLocale - Optional fallback locale code (defaults to 'en-us')
 * @returns The locale object (either existing or newly created)
 */
export async function ensureLocaleExists(
	client: Client,
	localeCode: string,
	fallbackLocale = 'en-us',
): Promise<Locale> {
	const existingLocales = await getLocales(client);
	const existing = existingLocales.find((loc) => loc.code === localeCode);

	if (existing !== undefined) {
		return existing;
	}

	// Locale doesn't exist - create it

	// Derive a reasonable display name from the locale code
	const name = deriveLocaleName(localeCode);

	const newLocale = await addLocale(client, localeCode, name, fallbackLocale);

	return newLocale;
}

/**
 * Derives a human-readable name from a locale code.
 * This is a basic implementation that can be expanded as needed.
 */
function deriveLocaleName(code: string): string {
	const nameMap: Record<string, string> = {
		'en-us': 'English - United States',
		'zh-chs': 'Chinese (simplified)',
		'zh-cht': 'Chinese (traditional)',
		'zh-cn': 'Chinese - China',
		'zh-hans': 'Chinese (simplified)',
		'zh-hant': 'Chinese (traditional)',
		'zh-tw': 'Chinese - Taiwan',
	};

	return nameMap[code.toLowerCase()] ?? code.toUpperCase();
}
