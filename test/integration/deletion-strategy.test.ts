import indexAssets from '#cli/cs/assets/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import { readdir, rm } from 'node:fs/promises';
import inspector from 'node:inspector/promises';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import TestContext from './lib/TestContext.js';

const longTest = 30000;

describe(
	'Deletion Strategy',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const ctx = new TestContext('fixtures/deletion-strategy');

		beforeAll(
			async () =>
				Store.run(ctx.ui, async () => {
					await push(ctx.client);
					await ctx.createFixtureClone();
				}),
			longTest,
		);

		afterAll(async () => ctx[Symbol.asyncDispose]());

		ctx.test(
			'deletion strategy is honored',
			async ({ client, ui, currentFixturePath }) =>
				Store.run(ui, async () => {
					// Arrange
					ui.options.schema.deletionStrategy = 'ignore';
					const items = await readdir(currentFixturePath);

					for (const item of items) {
						const fullPath = resolve(currentFixturePath, item);
						await rm(fullPath, { force: true, recursive: true });
					}

					// Act
					const results = await push(ctx.client);

					// Assert
					expect(results).toBeErrorFreeTransferResults();

					expect(results.get('Asset Folders')).toEqual(
						expect.objectContaining({
							status: 'fulfilled',
							value: {
								created: new Set(),
								deleted: new Set(),
								errored: new Map(),
								unmodified: new Set(['sub-folder']),
								updated: new Set(),
							},
						}),
					);

					expect(results.get('Assets')).toEqual(
						expect.objectContaining({
							status: 'fulfilled',
							value: {
								created: new Set(),
								deleted: new Set(),
								errored: new Map(),
								unmodified: new Set([
									'075eb5fa-99b3-4991-bd4d-cc50d3f194f4.webp',
									'sub-folder/a6a9b989-674c-4fc5-98d5-a6efa51c8467.webp',
								]),
								updated: new Set(),
							},
						}),
					);

					const inStack = await indexAssets(client);
					const assets = [...inStack.values()];

					expect(assets).toContainEqual(
						expect.objectContaining({
							filename: '075eb5fa-99b3-4991-bd4d-cc50d3f194f4.webp',
							parent_uid: null,
						}),
					);

					expect(assets).toContainEqual(
						expect.objectContaining({
							name: 'sub-folder',
							parent_uid: null,
						}),
					);

					expect(assets).toContainEqual(
						expect.objectContaining({
							filename: 'a6a9b989-674c-4fc5-98d5-a6efa51c8467.webp',
							parent_uid: expect.any(String),
						}),
					);
				}),
		);
	},
);
