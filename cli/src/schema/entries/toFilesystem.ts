import type { ContentType } from '#cli/cs/content-types/Types.js';
import exportEntry from '#cli/cs/entries/export.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import transformEntry from '#cli/dto/entry/fromCs.js';
import writeYaml from '#cli/fs/writeYaml.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
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

	const getPath = (entry: Entry) =>
		resolve(directory, resolveFilename(filenamesByTitle, entry));

	const write = async (entry: Entry) => {
		const exported = await exportEntry(
			contentType.uid,
			ctx.cs.client,
			entry.uid,
		);

		const { uid, ...transformed } = transformEntry(ctx, contentType, exported);

		return writeYaml(getPath(entry), transformed);
	};

	return processPlan<Entry>({
		create: write,
		deletionStrategy: 'delete',
		plan: planMerge(equality, csEntries, fsEntries),
		progress: bar,
		remove: async (entry) => rm(getPath(entry), { force: true }),
		update: write,
	});
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
