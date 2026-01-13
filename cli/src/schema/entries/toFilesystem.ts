import type { ContentType } from '#cli/cs/content-types/Types.js';
import exportEntryLocale from '#cli/cs/entries/exportEntryLocale.js';
import getEntryLocales from '#cli/cs/entries/getEntryLocales.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import transformEntry from '#cli/dto/entry/fromCs.js';
import writeYaml from '#cli/fs/writeYaml.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
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
	const directory = schemaDirectory(contentType.uid);
	const fsEntries = ctx.fs.entries.byTitleFor(contentType.uid);
	const csEntries = ctx.cs.entries.byTitleFor(contentType.uid);
	const filenamesByTitle = generateFilenames(csEntries);

	const getBasePath = (entry: Entry) =>
		resolve(directory, resolveFilename(filenamesByTitle, entry));

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

function createWriteFn(
	ctx: Ctx,
	contentType: ContentType,
	directory: string,
	getBasePath: (entry: Entry) => string,
) {
	return async (entry: Entry) => {
		let locales: readonly { code: string }[];
		try {
			locales = await getEntryLocales(
				ctx.cs.client,
				contentType.uid,
				entry.uid,
			);
		} catch {
			// If the locales endpoint fails (e.g., not supported by Contentstack instance),
			// fall back to single-locale behavior using entry's locale property
			if (!entry.locale || typeof entry.locale !== 'string') {
				// Skip entries without a valid locale
				getUi().warn(
					`Warning: Skipping entry "${entry.title}" (${entry.uid}) in ${contentType.uid} - no valid locale information available`,
				);
				return;
			}
			locales = [{ code: entry.locale }];
		}

		if (locales.length === 0) {
			// If no locales available, skip this entry
			getUi().warn(
				`Warning: Skipping entry "${entry.title}" (${entry.uid}) in ${contentType.uid} - no locales returned`,
			);
			return;
		}

		// If only one locale, save without locale suffix for backward compatibility
		const useLocaleSuffix = locales.length > 1;

		// Write all locale versions in parallel for better performance
		const writePromises = locales.map(async (locale) =>
			writeLocaleVersion(
				ctx,
				contentType,
				entry,
				locale.code,
				getBasePath,
				useLocaleSuffix,
			),
		);

		await Promise.all(writePromises);
	};
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

	const { uid, ...transformed } = transformEntry(ctx, contentType, exported);

	const basePath = getBasePath(entry);
	const filePath = useLocaleSuffix
		? basePath.replace(/\.yaml$/u, `.${localeCode}.yaml`)
		: basePath;
	await writeYaml(filePath, transformed);
}

function createRemoveFn(
	directory: string,
	getBasePath: (entry: Entry) => string,
) {
	return async (entry: Entry) => {
		const basePath = getBasePath(entry);
		const baseFilename = basename(basePath, '.yaml');

		try {
			const files = await readdir(directory);
			const pattern = new RegExp(
				`^${escapeRegex(baseFilename)}\\..*\\.yaml$`,
				'u',
			);

			for (const file of files) {
				// Remove both locale-suffixed files (entry.en-us.yaml) and base file (entry.yaml)
				if (pattern.test(file) || file === `${baseFilename}.yaml`) {
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
) {
	if (Filename in entry) {
		const embedded = entry[Filename];
		if (typeof embedded === 'string') {
			return embedded;
		}

		throw new Error(`Invalid embedded filename for entry ${entry.uid}`);
	}

	const generated = filenamesByTitle.get(entry.title);
	if (!generated) {
		const msg = `No filename found for entry [${entry.uid}]: ${entry.title}`;
		throw new Error(msg);
	}

	return generated;
}
