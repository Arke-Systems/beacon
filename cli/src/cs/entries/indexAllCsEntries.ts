import indexContentTypes from '#cli/cs/content-types/index.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import getUi from '../../schema/lib/SchemaUi.js';
import type Client from '../api/Client.js';
import type { ContentType } from '../content-types/Types.js';
import index from './index.js';
import type { Entry } from './Types.js';

export default async function indexAllCsEntries(
	client: Client,
): Promise<ReadonlyMap<ContentType, ReadonlySet<Entry>>> {
	const allEntries = new Map<ContentType, ReadonlySet<Entry>>();

	const contentTypes = [...(await indexContentTypes(client)).values()];

	const sorted = [...contentTypes].sort((a, b) =>
		a.title.localeCompare(b.title),
	);

	if (sorted.length === 0) {
		return allEntries;
	}

	const ui = getUi();

	{
		using bar = ui.createProgressBar('Indexing entries', sorted.length);

		for (const contentType of sorted) {
			using reporter = new ProgressReporter(bar, 'indexing', contentType.title);

			const entries = await index(client, contentType.uid);
			allEntries.set(contentType, new Set([...entries.values()]));
			bar.increment();
			reporter.finish('indexed');
		}
	}

	return allEntries;
}
