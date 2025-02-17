import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function canPullChanges({ client, ui }: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Act
		const results = await pull(client);

		// Assert
		expect(results).toBeErrorFreeTransferResults();
	});
}
