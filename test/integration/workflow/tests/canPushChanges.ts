import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function canPushChanges({ client, ui }: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Act
		const results = await push(client);

		// Assert
		expect(results).toBeErrorFreeTransferResults();
	});
}
