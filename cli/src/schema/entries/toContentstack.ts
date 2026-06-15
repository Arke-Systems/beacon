/* eslint-disable max-lines */
import type { ContentType } from '#cli/cs/content-types/Types.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import getEntryLocales from '#cli/cs/entries/getEntryLocales.js';
import importEntry from '#cli/cs/entries/import.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { ensureLocaleExists } from '#cli/cs/locales/ensureLocaleExists.js';
import { getLocales } from '#cli/cs/locales/getLocales.js';
import BeaconReplacer from '#cli/dto/entry/BeaconReplacer.js';
import { getFileExtension } from '#cli/fs/serializationFormat.js';
import escapeRegex from '#cli/util/escapeRegex.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import equality from './equality.js';
import buildCreator from './lib/buildCreator.js';
import generateFilenames from './lib/generateFilenames.js';
import loadEntryLocales, {
	type EntryWithLocale,
} from './lib/loadEntryLocales.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toContentstack(
	ctx: Ctx,
	contentType: ContentType,
	bar: ProgressBar,
) {
	const ui = getUi();
	const format = ui.options.schema.serializationFormat;

	const fsEntriesByTitle = ctx.fs.entries.byTitleFor(contentType.uid);
	const csEntriesByTitle = ctx.cs.entries.byTitleFor(contentType.uid);
	const transformer = new BeaconReplacer(ctx, contentType);
	const filenamesByTitle = generateFilenames(fsEntriesByTitle, format);
	const create = buildCreator(ctx, transformer, contentType);
	const update = buildUpdateFn(
		ctx,
		csEntriesByTitle,
		transformer,
		contentType,
		filenamesByTitle,
	);

	const result = await processPlan<Entry>({
		create,
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan: planMerge(equality, fsEntriesByTitle, csEntriesByTitle),
		progress: bar,
		remove: async (entry) => {
			await deleteEntry(ctx.cs.client, contentType.uid, entry.uid);
		},
		update,
	});

	// Process unmodified entries to ensure all locale versions are synced
	await processUnmodifiedEntries(
		result.unmodified,
		ctx,
		contentType,
		csEntriesByTitle,
		fsEntriesByTitle,
		transformer,
		filenamesByTitle,
	);

	return result;
}

function shouldSyncLocales(
	fsLocaleVersions: Awaited<ReturnType<typeof loadFsLocaleVersions>>,
	csLocaleSet: Set<string>,
): boolean {
	// Check if we have new locale versions that don't exist in Contentstack
	const fsLocaleSet = new Set(
		fsLocaleVersions.map((lv) => (lv.locale === 'default' ? null : lv.locale)),
	);
	return Array.from(fsLocaleSet).some(
		(locale) => locale !== null && !csLocaleSet.has(locale),
	);
}

async function syncUnmodifiedEntryLocales(
	ctx: Ctx,
	contentType: ContentType,
	cs: Entry,
	fs: Entry,
	transformer: BeaconReplacer,
	filenamesByTitle: ReadonlyMap<Entry['title'], string>,
): Promise<boolean> {
	const ui = getUi();

	// Load all locale versions from filesystem
	const fsLocaleVersions = await loadFsLocaleVersions(
		fs,
		contentType.uid,
		filenamesByTitle,
	);

	// Skip entries with empty title fields
	const [firstLocale] = fsLocaleVersions;
	if (firstLocale && !firstLocale.entry.title) {
		ui.warn(
			'Skipping unmodified entry with empty title field:',
			`file: ${fs.title}`,
			`(content type: ${contentType.uid})`,
		);
		return false;
	}

	const csLocaleSet = await getExistingLocales(ctx, contentType, cs.uid);

	// Only push if there are new locale versions to sync
	if (!shouldSyncLocales(fsLocaleVersions, csLocaleSet)) {
		return false;
	}

	// Push all locale versions (including new locales like zh-cn)
	await updateAllLocales(
		ctx,
		transformer,
		contentType,
		fsLocaleVersions,
		cs.uid,
		csLocaleSet,
	);

	const entry = { ...fs, uid: cs.uid };
	ctx.references.recordEntryForReferences(contentType.uid, entry);
	return true;
}

async function processUnmodifiedEntries(
	unmodified: Iterable<string>,
	ctx: Ctx,
	contentType: ContentType,
	csEntriesByTitle: ReadonlyMap<string, Entry>,
	fsEntriesByTitle: ReadonlyMap<string, Entry>,
	transformer: BeaconReplacer,
	filenamesByTitle: ReadonlyMap<Entry['title'], string>,
) {
	const ui = getUi();

	for (const title of unmodified) {
		const cs = csEntriesByTitle.get(title);
		const fs = fsEntriesByTitle.get(title);

		if (cs && !fs && ui.options.schema.deletionStrategy !== 'delete') {
			// The entry was deleted from the file system, but the user has chosen
			// to ignore deletions in Contentstack. The item is invalid as a
			// reference, but does not represent an error state.
			continue;
		}

		if (!cs || !fs) {
			throw new Error(`No matching entry found for ${title}.`);
		}

		await syncUnmodifiedEntryLocales(
			ctx,
			contentType,
			cs,
			fs,
			transformer,
			filenamesByTitle,
		);
	}
}

function buildUpdateFn(
	ctx: Ctx,
	csEntriesByTitle: ReadonlyMap<string, Entry>,
	transformer: BeaconReplacer,
	contentType: ContentType,
	filenamesByTitle: ReadonlyMap<Entry['title'], string>,
) {
	return async (entry: Entry) => {
		const match = csEntriesByTitle.get(entry.title);
		if (!match) {
			throw new Error(`No matching entry found for ${entry.title}.`);
		}

		const fsLocaleVersions = await loadFsLocaleVersions(
			entry,
			contentType.uid,
			filenamesByTitle,
		);

		// Skip entries with empty title fields
		const [firstLocale] = fsLocaleVersions;
		if (firstLocale && !firstLocale.entry.title) {
			getUi().warn(
				'Skipping update for entry with empty title field:',
				`file: ${entry.title}`,
				`(content type: ${contentType.uid})`,
			);
			return;
		}

		const csLocaleSet = await getExistingLocales(ctx, contentType, match.uid);

		await updateAllLocales(
			ctx,
			transformer,
			contentType,
			fsLocaleVersions,
			match.uid,
			csLocaleSet,
		);

		ctx.references.recordEntryForReferences(contentType.uid, {
			...entry,
			uid: match.uid,
		});
	};
}

async function loadFsLocaleVersions(
	entry: Entry,
	contentTypeUid: string,
	filenamesByTitle: ReadonlyMap<Entry['title'], string>,
) {
	const filename = filenamesByTitle.get(entry.title);
	if (!filename) {
		throw new Error(`No filename found for entry ${entry.title}.`);
	}

	const ui = getUi();
	const format = ui.options.schema.serializationFormat;
	const ext = getFileExtension(format);
	const extPattern = new RegExp(`${escapeRegex(ext)}$`, 'u');
	const baseFilename = filename.replace(extPattern, '');
	const directory = schemaDirectory(contentTypeUid);

	return loadEntryLocales(directory, entry.title, baseFilename);
}

async function getExistingLocales(
	ctx: Ctx,
	contentType: ContentType,
	entryUid: string,
): Promise<Set<string>> {
	try {
		const csLocales = await getEntryLocales(
			ctx.cs.client,
			contentType.uid,
			entryUid,
		);
		return new Set(csLocales.map((l) => l.code));
	} catch {
		// If the locales endpoint fails (e.g., not supported by Contentstack instance
		// or entry doesn't exist yet), return empty set to indicate no locales are known
		return new Set<string>();
	}
}

/**
 * Determines the master/default locale from a list of locales.
 * The master locale is the one without a fallback_locale property.
 * Falls back to the first locale if none found.
 */
function getMasterLocale(
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

async function importDefaultLocale(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	defaultLocaleVersion: EntryWithLocale,
	entryUid: string,
	csLocaleSet: Set<string>,
	masterLocaleCode: string | null,
) {
	// Use masterLocaleCode for the default locale transformation
	const localeCode = masterLocaleCode ?? undefined;
	const transformed = transformer.process(
		defaultLocaleVersion.entry,
		localeCode,
	);
	const overwrite = csLocaleSet.size > 0;

	// When there are multiple locales, explicitly specify the master locale
	// Contentstack requires the master locale to be specified when adding translations

	await importEntry(
		ctx.cs.client,
		contentType.uid,
		{ ...transformed, uid: entryUid },
		overwrite,
		localeCode,
	);
}

async function importOtherLocales(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	otherLocaleVersions: readonly EntryWithLocale[],
	entryUid: string,
) {
	const otherImportPromises = otherLocaleVersions.map(async (localeVersion) => {
		// Pass the locale to the transformer for proper HTML RTE entry reference processing
		const transformed = transformer.process(
			localeVersion.entry,
			localeVersion.locale,
		);

		return importEntry(
			ctx.cs.client,
			contentType.uid,
			{ ...transformed, uid: entryUid },
			true, // always overwrite for additional locales
			localeVersion.locale,
		);
	});

	await Promise.all(otherImportPromises);
}

async function updateAllLocales(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	fsLocaleVersions: Awaited<ReturnType<typeof loadFsLocaleVersions>>,
	entryUid: string,
	csLocaleSet: Set<string>,
) {
	// Ensure all required locales exist in the target stack before pushing entries
	const localeEnsurePromises = fsLocaleVersions
		.filter((lv) => lv.locale !== 'default')
		.map(async (lv) => ensureLocaleExists(ctx.cs.client, lv.locale));

	await Promise.all(localeEnsurePromises);

	// Determine the master locale for the default file
	const otherLocaleVersions = fsLocaleVersions.filter(
		(lv) => lv.locale !== 'default',
	);
	const masterLocaleCode =
		otherLocaleVersions.length > 0
			? await determineMasterLocale(ctx, csLocaleSet)
			: null;

	// Import locales sequentially: default locale first, then others
	// This is required because Contentstack needs the entry to exist in the default
	// locale before additional locale versions can be added.
	const defaultLocaleVersion = fsLocaleVersions.find(
		(lv) => lv.locale === 'default',
	);

	// Import default locale first (if it exists)
	if (defaultLocaleVersion) {
		await importDefaultLocale(
			ctx,
			transformer,
			contentType,
			defaultLocaleVersion,
			entryUid,
			csLocaleSet,
			masterLocaleCode,
		);
	}

	// Then import other locales in parallel
	await importOtherLocales(
		ctx,
		transformer,
		contentType,
		otherLocaleVersions,
		entryUid,
	);
}

/**
 * Determines the master locale for the stack.
 * First tries to infer from existing entry locales, then falls back to stack locales.
 */
async function determineMasterLocale(
	ctx: Ctx,
	csLocaleSet: Set<string>,
): Promise<string | null> {
	// If entry already has locales in Contentstack, try to infer from them
	if (csLocaleSet.size > 0) {
		// We can't determine fallback_locale from the Set alone
		// Fall through to get stack locales
	}

	// Get stack locales to determine the master
	try {
		const stackLocales = await getLocales(ctx.cs.client);
		return getMasterLocale(stackLocales);
	} catch {
		// If we can't get locales, fall back to null (undefined locale)
		// This maintains backward compatibility
		return null;
	}
}
