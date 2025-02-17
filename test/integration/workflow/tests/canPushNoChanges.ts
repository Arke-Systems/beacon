import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function canPushNoChanges({
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Act
		const results = await push(client);

		// Assert
		expect(results).toBeErrorFreeTransferResults();

		for (const [module, result] of results) {
			if (result.status !== 'fulfilled') {
				throw new Error('Expected all results to be fulfilled');
			}

			const { value } = result;

			(['created', 'updated', 'deleted', 'errored'] as const).forEach((key) => {
				const ctx = `${module} (${key})`;
				expect.soft(value[key].size, ctx).toBe(0);
			});
		}
	});
}
