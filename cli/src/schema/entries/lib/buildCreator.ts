import type { Schema } from '#cli/cs/Types.js';
import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import importEntry from '#cli/cs/entries/import.js';
import indexEntries from '#cli/cs/entries/index.js';
import type BeaconReplacer from '#cli/dto/entry/BeaconReplacer.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import { isDeepStrictEqual } from 'node:util';
import schemaDirectory from '../schemaDirectory.js';
import generateFilenames from './generateFilenames.js';
import loadEntryLocales from './loadEntryLocales.js';

export default function buildCreator(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
) {
	return async (entry: Entry) => {
		const fsLocaleVersions = await loadLocaleVersions(entry, contentType.uid);

		const created = await createFirstLocale(
			ctx,
			transformer,
			contentType,
			fsLocaleVersions,
		);

		await importAdditionalLocales(
			ctx,
			transformer,
			contentType,
			fsLocaleVersions,
			created,
		);

		ctx.references.recordEntryForReferences(contentType.uid, {
			...entry,
			uid: created.uid,
		});
	};
}

async function loadLocaleVersions(entry: Entry, contentTypeUid: string) {
	const filenamesByTitle = generateFilenames(new Map([[entry.title, entry]]));
	const filename = filenamesByTitle.get(entry.title);
	if (!filename) {
		throw new Error(`No filename found for entry ${entry.title}.`);
	}

	const baseFilename = filename.replace(/\.yaml$/u, '');
	const directory = schemaDirectory(contentTypeUid);
	const fsLocaleVersions = await loadEntryLocales(
		directory,
		entry.title,
		baseFilename,
	);

	if (fsLocaleVersions.length === 0) {
		throw new Error(`No locale versions found for entry ${entry.title}.`);
	}

	return fsLocaleVersions;
}

async function createFirstLocale(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	fsLocaleVersions: Awaited<ReturnType<typeof loadLocaleVersions>>,
): Promise<Entry> {
	const [firstLocale] = fsLocaleVersions;

	if (!firstLocale) {
		throw new Error('No locale versions found');
	}

	const transformed = transformer.process(firstLocale.entry);

	// Pass undefined for 'default' locale (single-locale backward compat)
	const locale =
		firstLocale.locale === 'default' ? undefined : firstLocale.locale;

	try {
		return await importEntry(
			ctx.cs.client,
			contentType.uid,
			transformed,
			false,
			locale,
		);
	} catch (ex) {
		return await handleDuplicateKeyError(
			ex,
			ctx,
			contentType,
			transformed,
			locale,
		);
	}
}

async function handleDuplicateKeyError(
	ex: unknown,
	ctx: Ctx,
	contentType: ContentType,
	transformed: ReturnType<BeaconReplacer['process']>,
	locale: string | undefined,
): Promise<Entry> {
	if (isDuplicateKeyError(ex)) {
		const uid = await getUidByTitle(
			ctx.cs.client,
			ctx.cs.globalFields,
			contentType,
			transformed.title,
		);

		if (!uid) {
			logInvalidState(contentType.title, transformed.title);
			const newError = new Error(
				`Failed to create entry ${transformed.title}: Contentstack reported a duplicate title but the entry was not found after re-indexing`,
			);
			// Preserve the original error as the cause
			if (ex instanceof Error) {
				newError.cause = ex;
			}
			throw newError;
		}

		return await importEntry(
			ctx.cs.client,
			contentType.uid,
			{ ...transformed, uid },
			true,
			locale,
		);
	}

	throw ex;
}

async function importAdditionalLocales(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
	fsLocaleVersions: Awaited<ReturnType<typeof loadLocaleVersions>>,
	created: Entry,
) {
	// Import all additional locale versions in parallel for better performance
	const importPromises = fsLocaleVersions
		.slice(1)
		.map(async (localeVersion) => {
			if (localeVersion.locale === 'default') {
				// Skip 'default' locale (already handled by first locale)
				return;
			}

			const localeTransformed = transformer.process(localeVersion.entry);

			return importEntry(
				ctx.cs.client,
				contentType.uid,
				{ ...localeTransformed, uid: created.uid },
				false,
				localeVersion.locale,
			);
		});

	await Promise.all(importPromises);
}

function isDuplicateKeyError(ex: unknown) {
	if (!(ex instanceof ContentstackError)) {
		return false;
	}

	const invalidDataCode = 119;
	if (ex.code !== invalidDataCode) {
		return false;
	}

	return isDeepStrictEqual(ex.details, { title: ['is not unique.'] });
}

async function getUidByTitle(
	client: Client,
	globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
	title: string,
) {
	const entries = await indexEntries(client, globalFieldsByUid, contentType);
	return entries.get(title)?.uid;
}

function logInvalidState(contentTypeTitle: string, entryTitle: string) {
	const y = createStylus('yellowBright');
	const ui = getUi();
	const msg1 = y`While importing ${contentTypeTitle} entry ${entryTitle},`;
	const msg2 = 'Contentstack reported a duplicate key error based on the';
	const msg3 = 'title, but no entry with that title was found after';
	const msg4 = 're-indexing.';
	const msg = [msg1, msg2, msg3, msg4].join(' ');
	ui.warn(msg);
}
