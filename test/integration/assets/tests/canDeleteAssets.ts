import deleteAsset from '#cli/cs/assets/delete.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';
import assetExists from '../lib/assetExists.js';

export default async function canDeleteAssets({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Act: Remove the asset
		await deleteAsset(client, state.martin!.uid);

		// Asset: Was the asset removed?
		expect(await assetExists(client, state.martin!.uid)).toBe(false);
		state.martin = undefined;
	});
}
