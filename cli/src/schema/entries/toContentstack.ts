import type { ContentType } from '#cli/cs/content-types/Types.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import getEntryLocales from '#cli/cs/entries/getEntryLocales.js';
import importEntry from '#cli/cs/entries/import.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import BeaconReplacer from '#cli/dto/entry/BeaconReplacer.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import equality from './equality.js';
import buildCreator from './lib/buildCreator.js';
import generateFilenames from './lib/generateFilenames.js';
import loadEntryLocales from './lib/loadEntryLocales.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toContentstack(
	ctx: Ctx,
	contentType: ContentType,
	bar: ProgressBar,
) {
	const ui = getUi();

	const fsEntriesByTitle = ctx.fs.entries.byTitleFor(contentType.uid);
	const csEntriesByTitle = ctx.cs.entries.byTitleFor(contentType.uid);
	const transformer = new BeaconReplacer(ctx, contentType);
	const filenamesByTitle = generateFilenames(fsEntriesByTitle);
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
		remove: async (entry) =>
			deleteEntry(ctx.cs.client, contentType.uid, entry.uid),
		update,
	});

	for (const title of result.unmodified) {
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

		const entry = { ...fs, uid: cs.uid };
		ctx.references.recordEntryForReferences(contentType.uid, entry);
	}

	return result;
}

function buildUpdateFn(
	ctx: Ctx,
	csEntriesByTitle: ReadonlyMap<string, Entry>,
	transformer: BeaconReplacer,
	contentType: ContentType,
	filenamesByTitle: ReadonlyMap<Entry['uid'], string>,
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
	filenamesByTitle: ReadonlyMap<Entry['uid'], string>,
) {
	const filename = filenamesByTitle.get(entry.title);
	if (!filename) {
		throw new Error(`No filename found for entry ${entry.title}.`);
	}

	const baseFilename = filename.replace(/\.yaml$/u, '');
	const directory = schemaDirectory(contentTypeUid);

	return loadEntryLocales(directory, entry.title, baseFilename);
}

async function getExistingLocales(
	ctx: Ctx,
	contentType: ContentType,
	entryUid: string,
) {
	const csLocales = await getEntryLocales(
		ctx.cs.client,
		contentType.uid,
		entryUid,
	);
	return new Set(csLocales.map((l) => l.code));
}

async function updateAllLocales(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	fsLocaleVersions: Awaited<ReturnType<typeof loadFsLocaleVersions>>,
	entryUid: string,
	csLocaleSet: Set<string>,
) {
	// Import all locale versions in parallel for better performance
	const importPromises = fsLocaleVersions.map(async (localeVersion) => {
		const transformed = transformer.process(localeVersion.entry);

		// Pass undefined for 'default' locale (single-locale backward compat)
		const locale =
			localeVersion.locale === 'default' ? undefined : localeVersion.locale;
		const overwrite = locale
			? csLocaleSet.has(localeVersion.locale)
			: csLocaleSet.size > 0;

		return importEntry(
			ctx.cs.client,
			contentType.uid,
			{ ...transformed, uid: entryUid },
			overwrite,
			locale,
		);
	});

	await Promise.all(importPromises);
}
