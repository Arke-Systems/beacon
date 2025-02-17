import index from '#cli/cs/taxonomies/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedTaxonomies({
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const taxonomies = await index(client);
		const taxonomyUids = [...taxonomies.keys()].sort();
		expect(taxonomyUids).toEqual(['event_category', 'location']);
	});
}
