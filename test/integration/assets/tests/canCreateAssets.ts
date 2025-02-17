import create from '#cli/cs/assets/create.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import assetExists from '../lib/assetExists.js';
import type { AssetFixtures } from '../lib/AssetTestContext.js';

export default async function canCreateFolders({
	client,
	currentFixturePath,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		const martinPath = resolve(currentFixturePath, 'assets', 'martin.webp');
		const mattimeoPath = resolve(currentFixturePath, 'assets', 'mattimeo.webp');

		// Act: Add assets to the folder.
		state.martin = await create(client, {
			description: 'This is a test asset.',
			filePath: martinPath,
			parent_uid: state.parentFolder!.uid,
			tags: ['test', 'asset'],
			title: 'Test Asset: Martin',
		});

		state.mattimeo = await create(client, {
			description: 'This is also a test asset.',
			filePath: mattimeoPath,
			parent_uid: state.parentFolder!.uid,
			tags: ['test', 'asset'],
			title: 'Test Asset: Mattimeo',
		});

		// Assert: Was the asset created?
		expect(state.martin).not.toBeUndefined();
		expect(state.mattimeo).not.toBeUndefined();

		expect(state.martin).toMatchObject({
			description: 'This is a test asset.',
			parent_uid: state.parentFolder!.uid,
			tags: ['test', 'asset'],
			title: 'Test Asset: Martin',
		});

		expect(state.mattimeo).toMatchObject({
			description: 'This is also a test asset.',
			parent_uid: state.parentFolder!.uid,
			tags: ['test', 'asset'],
			title: 'Test Asset: Mattimeo',
		});

		expect(await assetExists(client, state.martin.uid)).toBe(true);
		expect(await assetExists(client, state.mattimeo.uid)).toBe(true);
	});
}
