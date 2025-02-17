import index from '#cli/cs/global-fields/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedGlobalFields({
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const globalFields = await index(client);
		const globalFieldUids = [...globalFields.keys()].sort();
		expect(globalFieldUids).toEqual(['contact', 'seo']);
	});
}
