import clear from '#cli/schema/clear.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { TestFixtures } from './lib/TestContext.js';
import TestContext from './lib/TestContext.js';

const longTest = 30000;

describe('Global Fields', () => {
	const ctx = new TestContext('fixtures/push-globals');
	beforeAll(async () => clear(ctx.client, ctx.ui), longTest);
	afterAll(async () => ctx[Symbol.asyncDispose]());

	ctx.test(
		'can import global fields that refer to content types',
		async ({ client, ui }: TestFixtures) =>
			Store.run(ui, async () => {
				// Act
				const results = await push(client);

				// Assert
				expect(results).toBeErrorFreeTransferResults();
			}),
	);
});
