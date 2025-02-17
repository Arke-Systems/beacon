import createFolder from '#cli/cs/assets/createFolder.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';
import folderExists from '../lib/folderExists.js';

export default async function canCreateFolders({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Act: Create a folder.
		state.parentFolder = await createFolder(client, state.folderName);

		// Assert: Was the folder created?
		expect(state.parentFolder).not.toBeUndefined();
		expect(await folderExists(client, state.parentFolder.uid)).toBe(true);
	});
}
