import Assets from '#cli/cs/assets/Assets.js';
import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import assetExists from '../lib/assetExists.js';
import type { AssetFixtures } from '../lib/AssetTestContext.js';
import folderExists from '../lib/folderExists.js';

export default async function cleansEmptyFolders({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const initialByUid = new Map<RawAssetItem['uid'], RawAssetItem>([
			[state.parentFolder!.uid, state.parentFolder!],
			[state.mattimeo!.uid, state.mattimeo!],
		]);

		const mutableState = new Assets(client, initialByUid);
		const itemPath = `${state.parentFolder!.name}/${state.mattimeo!.filename}`;

		// Act
		await mutableState.deleteAsset(itemPath);

		// Assert
		expect(await assetExists(client, state.mattimeo!.uid)).toBe(false);
		state.mattimeo = undefined;

		expect(await folderExists(client, state.parentFolder!.uid)).toBe(false);
		state.parentFolder = undefined;
	});
}
