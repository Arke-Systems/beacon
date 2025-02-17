import createFolder from '#cli/cs/assets/createFolder.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';
import folderExists from '../lib/folderExists.js';

export default async function canCreateSubfolders({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Act: Create a subfolder.
		state.subFolder = await createFolder(
			client,
			state.subfolderName,
			state.parentFolder!.uid,
		);

		// Assert: Was the folder created?
		expect(state.subFolder.parent_uid).toBe(state.parentFolder!.uid);
		expect(await folderExists(client, state.subFolder.uid)).toBe(true);
	});
}
