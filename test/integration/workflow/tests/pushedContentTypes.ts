import index from '#cli/cs/content-types/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedContentTypes({
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const contentTypes = await index(client);
		const contentTypeUids = [...contentTypes.keys()].sort();
		expect(contentTypeUids).toEqual(['event', 'home_page']);
	});
}
