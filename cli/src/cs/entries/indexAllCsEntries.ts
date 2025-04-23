import indexContentTypes from '#cli/cs/content-types/index.js';
import indexGlobalFields from '#cli/cs/global-fields/index.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import getUi from '../../schema/lib/SchemaUi.js';
import type Client from '../api/Client.js';
import type { ContentType } from '../content-types/Types.js';
import type { Schema } from '../Types.js';
import index from './index.js';
import type { Entry } from './Types.js';

export default async function indexAllCsEntries(
	client: Client,
): Promise<
	[
		ReadonlyMap<Schema['uid'], Schema>,
		ReadonlyMap<ContentType, ReadonlySet<Entry>>,
	]
> {
	const allEntries = new Map<ContentType, ReadonlySet<Entry>>();

	const [globalFields, rawContentTypes] = await Promise.all([
		indexGlobalFields(client),
		indexContentTypes(client),
	]);

	const sorted = [...rawContentTypes.values()].sort((a, b) =>
		a.title.localeCompare(b.title),
	);

	if (sorted.length === 0) {
		return [globalFields, allEntries];
	}

	const ui = getUi();

	{
		using bar = ui.createProgressBar('Indexing entries', sorted.length);

		for (const contentType of sorted) {
			using reporter = new ProgressReporter(bar, 'indexing', contentType.title);

			const entries = await index(client, contentType);
			allEntries.set(contentType, new Set([...entries.values()]));
			bar.increment();
			reporter.finish('indexed');
		}
	}

	return [globalFields, allEntries];
}
