import inspector from 'node:inspector/promises';
import { afterAll, describe } from 'vitest';
import AssetTestContext from './lib/AssetTestContext.js';
import canCreateAssets from './tests/canCreateAssets.js';
import canCreateFolders from './tests/canCreateFolders.js';
import canCreateNestedAsset from './tests/canCreateNestedAsset.js';
import canCreateSubfolders from './tests/canCreateSubfolders.js';
import canDeleteAssets from './tests/canDeleteAssets.js';
import canDeleteFolders from './tests/canDeleteFolders.js';
import canIndexAllAssets from './tests/canIndexAllAssets.js';
import cleansEmptyFolders from './tests/cleansEmptyFolders.js';

const longTest = 30000;

describe(
	'Contentstack Assets',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const ctx = new AssetTestContext();
		afterAll(async () => ctx[Symbol.asyncDispose]());

		// (Empty state)

		ctx.test('Can create a folder', canCreateFolders);

		// 📁 parentFolder

		ctx.test('Can create assets', canCreateAssets);

		// 📁 parentFolder
		//  ├ 🐁 martin
		//  └ 🦊 mattimeo

		ctx.test('Can create a sub-folder', canCreateSubfolders);

		// 📁 parentFolder
		//  ├ 📁 subfolder
		//  ├ 🐁 martin
		//  └ 🦊 mattimeo

		ctx.test('Can create assets in a sub-folder', canCreateNestedAsset);

		// 📁 parentFolder
		//  ├ 📁 subfolder
		//  │  └ 🐀 mossflower
		//  ├ 🐁 martin
		//  └ 🦊 mattimeo

		ctx.test('Can index all assets', canIndexAllAssets);

		// (no change to state)

		ctx.test('Can delete an asset', canDeleteAssets);

		// 📁 parentFolder
		//  ├ 📁 subfolder
		//  │  └ 🐀 mossflower
		//  └ 🦊 mattimeo

		ctx.test('Can delete a folder', canDeleteFolders);

		// 📁 parentFolder
		//  └ 🦊 mattimeo

		ctx.test('Cleans empty folders', cleansEmptyFolders);

		// (Empty state)
	},
);
