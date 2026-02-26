import type { ContentType } from '#cli/cs/content-types/Types.js';
import assets from '../assets/toFilesystem.js';
import contentTypes from '../content-types/toFilesystem.js';
import type Ctx from '../ctx/Ctx.js';
import clean from '../entries/clean.js';
import entries from '../entries/toFilesystem.js';
import globalFields from '../global-fields/toFilesystem.js';
import taxonomies from '../taxonomies/toFilesystem.js';
import type TransferResults from '../xfer/TransferResults.js';
import getUi from './SchemaUi.js';

export default async function* pullModules(
	ctx: Ctx,
): AsyncGenerator<readonly [string, Promise<TransferResults>]> {
	yield ['Assets', assets(ctx)];
	yield ['Global Fields', globalFields(ctx)];
	yield ['Taxonomies', taxonomies(ctx)];
	yield ['Content Types', contentTypes(ctx)];

	const ui = getUi();
	const summary = summarizeContentTypes(
		ctx,
		ui.options.schema.entries.isIncluded,
	);
	const total = [...summary.values()].reduce((acc, count) => acc + count, 0);

	if (total === 0) {
		return;
	}

	{
		using bar = ui.createProgressBar('Entries', total);

		for (const contentType of summary.keys()) {
			const task = entries(ctx, contentType, bar);
			yield [`${contentType.title} Entries`, task];
			await Promise.allSettled([task]);
		}
	}

	yield [
		'Stale Entries',
		clean(ui.options.schema.schemaPath, new Set(ctx.cs.contentTypes.keys())),
	];
}

function summarizeContentTypes(
	ctx: Ctx,
	isIncluded: (contentTypeUid: string) => boolean,
): ReadonlyMap<ContentType, number> {
	const sorter = new Intl.Collator();

	return [...ctx.cs.contentTypes.values()]
		.filter((contentType) => isIncluded(contentType.uid))
		.sort((a, b) => sorter.compare(a.title, b.title))
		.reduce((acc, contentType) => {
			const titles = new Set([
				...ctx.cs.entries.byTitleFor(contentType.uid).keys(),
				...ctx.fs.entries.byTitleFor(contentType.uid).keys(),
			]);

			return acc.set(contentType, titles.size);
		}, new Map<ContentType, number>());
}
