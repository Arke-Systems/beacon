import create from '#cli/cs/assets/create.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';

export default async function canCreateNestedAsset({
	client,
	currentFixturePath,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		const mossflowerPath = resolve(
			currentFixturePath,
			'assets',
			'mossflower.webp',
		);

		state.mossflower = await create(client, {
			description: 'This is another test asset.',
			filePath: mossflowerPath,
			parent_uid: state.subFolder!.uid,
			tags: ['test', 'asset', 'another'],
			title: 'Another Test Asset',
		});

		expect(state.mossflower).not.toBeUndefined();
	});
}
