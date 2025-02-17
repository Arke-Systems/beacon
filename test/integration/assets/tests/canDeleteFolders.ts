import deleteFolder from '#cli/cs/assets/deleteFolder.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';
import assetExists from '../lib/assetExists.js';
import folderExists from '../lib/folderExists.js';

export default async function canDeleteFolders({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Act: Delete the primary folder.
		await deleteFolder(client, state.subFolder!.uid);

		// Assert: Was it deleted?
		expect(await folderExists(client, state.subFolder!.uid)).toBe(false);
		state.subFolder = undefined;

		// Assert: Deleting the parent folder should delete all contents.
		expect(await assetExists(client, state.mossflower!.uid)).toBe(false);
		state.mossflower = undefined;
	});
}
