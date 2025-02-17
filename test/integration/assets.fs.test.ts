import Assets from '#cli/fs/assets/Assets.js';
import type AssetMeta from '#cli/schema/assets/AssetMeta.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { afterAll, describe, expect } from 'vitest';
import TestContext from './lib/TestContext.js';

describe(
	'Filesystem Assets',
	{ concurrent: false, sequential: true, timeout: 30000 },
	() => {
		const ctx = new TestContext('fixtures/assets-fs');
		afterAll(async () => ctx[Symbol.asyncDispose]());

		ctx.test('Can index all assets', async ({ ui }) =>
			Store.run(ui, async () => {
				// Act
				const result = await Assets.create();

				// Assert
				expect(result.assetsByPath).toEqual(
					new Map<string, AssetMeta>([
						[
							'luke.webp',
							{
								description: 'The 12th book in the Redwall series.',
								fileSize: 41406,
								itemPath: 'luke.webp',
								tags: new Set(['luke']),
								title: 'Luke the Warrior',
							},
						],
						[
							'sub-folder/Skarlath_&_Sunflash.webp',
							{
								description: 'The 8th book in the Redwall series.',
								fileSize: 57186,
								itemPath: 'sub-folder/Skarlath_&_Sunflash.webp',
								tags: new Set(['skarlath', 'sunflash']),
								title: 'Outcast of Redwall',
							},
						],
					]),
				);
			}),
		);
	},
);
