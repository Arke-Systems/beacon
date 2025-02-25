import clear from '#cli/schema/clear.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import push from '#cli/schema/push.js';
import inspector from 'node:inspector/promises';
import { inspect } from 'node:util';
import { afterAll, afterEach, beforeEach, describe, expect } from 'vitest';
import TestContext from '../lib/TestContext.js';
import TestLogContext from '../lib/TestLogContext.js';
import Theory from './lib/Theory.js';
import arrange from './lib/arrange.js';
import expected from './lib/expected.js';

const longTest = 30000;

describe(
	'Asset Filters',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const logs = new TestLogContext();
		const ctx = new TestContext('fixtures/asset-filters', logs);

		beforeEach(async () => {
			ctx.ui.options.schema.assets = { isIncluded: () => true };

			await clear(ctx.client, ctx.ui);
			await ctx.createFixtureClone();
		}, longTest);

		afterEach(() => logs.clear());
		afterAll(async () => ctx[Symbol.asyncDispose]());

		// action, cs, fs, included, identical, expected
		const theories: readonly Theory[] = [
			// Expectations should mirror theories in
			// cli/src/schema/assets/lib/planPush.test.ts
			new Theory('push', true, true, true, true, 'skip'),
			new Theory('push', true, true, true, false, 'update'),
			new Theory('push', true, true, false, true, 'skip'),
			new Theory('push', true, true, false, false, 'skip'),
			new Theory('push', true, false, true, true, 'delete'),
			new Theory('push', true, false, true, false, 'delete'),
			new Theory('push', true, false, false, true, 'skip'),
			new Theory('push', true, false, false, false, 'skip'),
			new Theory('push', false, true, true, true, 'create'),
			new Theory('push', false, true, true, false, 'create'),
			new Theory('push', false, true, false, true, 'skip'),
			new Theory('push', false, true, false, false, 'skip'),

			// Expectations should mirror theories in
			// cli/src/schema/assets/lib/planPull.test.ts
			new Theory('pull', true, true, true, true, 'skip'),
			new Theory('pull', true, true, true, false, 'update'),
			new Theory('pull', true, true, false, true, 'delete'),
			new Theory('pull', true, true, false, false, 'delete'),
			new Theory('pull', true, false, true, true, 'create'),
			new Theory('pull', true, false, true, false, 'create'),
			new Theory('pull', true, false, false, true, 'skip'),
			new Theory('pull', true, false, false, false, 'skip'),
			new Theory('pull', false, true, true, true, 'delete'),
			new Theory('pull', false, true, true, false, 'delete'),
			new Theory('pull', false, true, false, true, 'delete'),
			new Theory('pull', false, true, false, false, 'delete'),
		];

		theories.forEach((theory) => {
			ctx.test(
				inspect(theory, { breakLength: Infinity, colors: true, compact: true }),
				async ({ client, currentFixturePath, originalFixturePath, ui }) =>
					Store.run(ui, async () => {
						// Arrange
						await arrange(
							theory,
							client,
							currentFixturePath,
							originalFixturePath,
							ui,
						);

						// Act
						const results =
							theory.action === 'push'
								? await push(client)
								: await pull(client);

						// Assert
						expect(results).toBeErrorFreeTransferResults();

						const assetResults = extractAssetResults(results);
						const expectedResults = expected(theory);
						expect(assetResults).toEqual(expectedResults);
					}),
			);
		});
	},
);

function extractAssetResults(results: Awaited<ReturnType<typeof pull>>) {
	const result = results.get('Assets')!;

	if (result.status !== 'fulfilled') {
		throw new Error('Asset promise unfulfilled');
	}

	return result.value;
}
