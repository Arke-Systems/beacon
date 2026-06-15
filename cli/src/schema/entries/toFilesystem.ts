import type { ContentType } from '#cli/cs/content-types/Types.js';
import exportEntryLocale from '#cli/cs/entries/exportEntryLocale.js';
import getEntryLocales from '#cli/cs/entries/getEntryLocales.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import transformEntry from '#cli/dto/entry/fromCs.js';
import { getFileExtension } from '#cli/fs/serializationFormat.js';
import writeSerializedData from '#cli/fs/writeSerializedData.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import sanitize from 'sanitize-filename';
import escapeRegex from '#cli/util/escapeRegex.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import { readdir, rm } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type Ctx from '../ctx/Ctx.js';
import Filename from '../xfer/Filename.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import equality from './equality.js';
import generateFilenames from './lib/generateFilenames.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toFilesystem(
	ctx: Ctx,
	contentType: ContentType,
	bar: ProgressBar,
) {
	const ui = getUi();
	const format = ui.options.schema.serializationFormat;
	const directory = schemaDirectory(contentType.uid);
	const fsEntries = ctx.fs.entries.byTitleFor(contentType.uid);
	const csEntries = ctx.cs.entries.byTitleFor(contentType.uid);
	const filenamesByTitle = generateFilenames(csEntries, format);

	const getBasePath = (entry: Entry) =>
		resolve(directory, resolveFilename(filenamesByTitle, entry, format));

	const write = createWriteFn(ctx, contentType, directory, getBasePath);
	const remove = createRemoveFn(directory, getBasePath);

	return processPlan<Entry>({
		create: write,
		deletionStrategy: 'delete',
		plan: planMerge(equality, csEntries, fsEntries),
		progress: bar,
		remove,
		update: write,
	});
}

async function fetchEntryLocales(
	ctx: Ctx,
	contentType: ContentType,
	entry: Entry,
): Promise<readonly { code: string }[] | null> {
	try {
		const locales = await getEntryLocales(
			ctx.cs.client,
			contentType.uid,
			entry.uid,
		);

		// Debug logging for multi-locale entries
		const ui = getUi();
		if (ui.options.verbose && locales.length > 1) {
			ui.info(
				`Entry "${entry.title}" has ${locales.length} locales: ${locales.map((l) => l.code).join(', ')}`,
			);
		}
		return locales;
	} catch {
		// If the locales endpoint fails (e.g., not supported by Contentstack instance),
		// fall back to single-locale behavior using entry's locale property
		if (!entry.locale || typeof entry.locale !== 'string') {
			// Skip entries without a valid locale
			getUi().warn(
				`Warning: Skipping entry "${entry.title}" (${entry.uid}) in ${contentType.uid} - no valid locale information available`,
			);
			return null;
		}
		return [{ code: entry.locale }];
	}
}

/**
 * Determines the default (master) locale from a list of locales.
 * The default locale is typically:
 * 1. The one without a fallback_locale property (master locale)
 * 2. Or the first locale in the list (Contentstack returns master first)
 */
function getDefaultLocale(
	locales: readonly { code: string; fallback_locale?: string }[],
): string | null {
	if (locales.length === 0) {
		return null;
	}

	// Find locale without a fallback - this is the master locale
	const masterLocale = locales.find((locale) => !locale.fallback_locale);
	if (masterLocale) {
		return masterLocale.code;
	}

	// Fallback to first locale if none found without fallback_locale
	return locales[0]?.code ?? null;
}

function createWriteFn(
	ctx: Ctx,
	contentType: ContentType,
	directory: string,
	getBasePath: (entry: Entry) => string,
) {
	return async (entry: Entry) => {
		const locales = await fetchEntryLocales(ctx, contentType, entry);

		if (!locales || locales.length === 0) {
			// If no locales available, skip this entry
			if (locales?.length === 0) {
				getUi().warn(
					`Warning: Skipping entry "${entry.title}" (${entry.uid}) in ${contentType.uid} - no locales returned`,
				);
			}
			return;
		}

		// If only one locale, save without locale suffix for backward compatibility.
		// When multiple locales exist, write the default locale as base file and other locales
		// with locale suffixes (e.g., Entry.yaml for default, Entry.zh-cn.yaml for Chinese)
		const defaultLocaleCode = getDefaultLocale(locales);

		// Write all locale versions in parallel for better performance
		const writePromises = locales.map(async (locale) => {
			const isDefaultLocale = locale.code === defaultLocaleCode;
			// Use locale suffix for non-default locales when multiple locales exist
			const useLocaleSuffix = locales.length > 1 && !isDefaultLocale;

			return writeLocaleVersion(
				ctx,
				contentType,
				entry,
				locale.code,
				getBasePath,
				useLocaleSuffix,
			);
		});

		await Promise.all(writePromises);
	};
}

function shouldSkipFallbackLocale(
	entry: Entry,
	exported: Entry,
	localeCode: string,
	useLocaleSuffix: boolean,
): boolean {
	// Debug: Log the exported locale vs requested locale
	const ui = getUi();
	if (
		ui.options.verbose &&
		useLocaleSuffix &&
		exported.locale &&
		typeof exported.locale === 'string'
	) {
		ui.info(
			`Entry "${entry.title}": requested="${localeCode}", exported.locale="${exported.locale}", title="${exported.title}"`,
		);
	}

	// Skip writing this locale version if it's a fallback (locale doesn't match requested)
	// This happens when Contentstack returns the default locale content because
	// no localized version exists for the requested locale
	// Check for fallback regardless of useLocaleSuffix to prevent overwriting base files
	// with content from the wrong locale
	if (
		exported.locale &&
		typeof exported.locale === 'string' &&
		exported.locale !== localeCode
	) {
		// This is a fallback locale, skip writing it
		if (ui.options.verbose) {
			ui.warn(
				`Skipping locale file for entry "${entry.title}" (${entry.uid}): requested locale "${localeCode}" but got "${exported.locale}" (fallback detected)`,
			);
		}
		return true;
	}
	return false;
}

async function writeLocaleVersion(
	ctx: Ctx,
	contentType: ContentType,
	entry: Entry,
	localeCode: string,
	getBasePath: (entry: Entry) => string,
	useLocaleSuffix: boolean,
) {
	const exported = await exportEntryLocale(
		contentType.uid,
		ctx.cs.client,
		entry.uid,
		localeCode,
	);

	if (shouldSkipFallbackLocale(entry, exported, localeCode, useLocaleSuffix)) {
		return;
	}

	const { uid, ...transformed } = transformEntry(ctx, contentType, exported);

	// Preserve the actual locale code from the source stack
	// This ensures we maintain the exact language-region configuration
	if ('locale' in transformed) {
		transformed.locale = localeCode;
	}

	const ui = getUi();
	const format = ui.options.schema.serializationFormat;
	const ext = getFileExtension(format);
	const basePath = getBasePath(entry);
	const extPattern = new RegExp(`${escapeRegex(ext)}$`, 'u');
	const filePath = useLocaleSuffix
		? basePath.replace(extPattern, `.${localeCode}${ext}`)
		: basePath;
	await writeSerializedData(filePath, transformed, format);
}

function createRemoveFn(
	directory: string,
	getBasePath: (entry: Entry) => string,
) {
	return async (entry: Entry) => {
		const ui = getUi();
		const format = ui.options.schema.serializationFormat;
		const ext = getFileExtension(format);
		const basePath = getBasePath(entry);
		const baseFilename = basename(basePath, ext);

		try {
			const files = await readdir(directory);
			const escapedExt = escapeRegex(ext).replace(/^\\./u, ''); // Remove leading backslash-dot
			const pattern = new RegExp(
				`^${escapeRegex(baseFilename)}\\..*\\.${escapedExt}$`,
				'u',
			);

			for (const file of files) {
				// Remove both locale-suffixed files (entry.en-us.ext) and base file (entry.ext)
				if (pattern.test(file) || file === `${baseFilename}${ext}`) {
					await rm(resolve(directory, file), { force: true });
				}
			}
		} catch {
			// Directory might not exist, which is fine
		}
	};
}

function resolveFilename(
	filenamesByTitle: ReadonlyMap<Entry['title'], string>,
	entry: Entry,
	format: 'json' | 'yaml',
) {
	const ext = getFileExtension(format);

	if (Filename in entry) {
		const embedded = entry[Filename];
		if (typeof embedded === 'string') {
			return embedded;
		}

		throw new Error(`Invalid embedded filename for entry ${entry.uid}`);
	}

	const generated = filenamesByTitle.get(entry.title);
	if (generated) {
		return generated;
	}

	// Fallback: sanitize the entry title to produce a filename so deletions
	// and other operations do not fail when a mapping is missing. This can
	// happen when entries exist on one side but not the other during merge
	// plans. Use the same sanitization rules as `generateFilenames`.
	const fallback = sanitizeFilename(entry.title) + ext;
	return fallback;
}

function sanitizeFilename(name: string): string {
	const raw = name.trim();
	const sanitized = sanitize(raw, { replacement: '_' });
	return sanitized.trim() || 'Untitled';
}
