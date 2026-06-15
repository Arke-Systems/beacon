import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';
import type { Locale } from './getLocales.js';

interface AddLocaleRequest {
	readonly locale: {
		readonly code: string;
		readonly fallback_locale?: string;
		readonly name?: string;
	};
}

/**
 * Adds a new locale to the stack.
 * @param client - Contentstack API client
 * @param code - Locale code (e.g., 'zh-cn', 'zh-chs')
 * @param name - Display name for the locale (e.g., 'Chinese - China')
 * @param fallbackLocale - Optional fallback locale code
 */
export async function addLocale(
	client: Client,
	code: string,
	name?: string,
	fallbackLocale?: string,
): Promise<Locale> {
	const requestBody: AddLocaleRequest = {
		locale: {
			code,
			...(fallbackLocale !== undefined && { fallback_locale: fallbackLocale }),
			...(name !== undefined && { name }),
		},
	};

	const response = await client.POST('/v3/locales', {
		body: requestBody as never,
	});

	const msg = `Failed to add locale '${code}'`;
	ContentstackError.throwIfError(response.error, msg);

	if (!response.response.ok) {
		throw new Error(msg);
	}

	const { data } = response;

	if (!isRecord(data)) {
		throw new TypeError(msg);
	}

	const { locale } = data;

	if (!isRecord(locale)) {
		throw new TypeError(msg);
	}

	return locale as Locale;
}
