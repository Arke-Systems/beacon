import index from '#cli/cs/assets/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { AssetFixtures } from '../lib/AssetTestContext.js';

export default async function canIndexAllAssets({
	client,
	state,
	ui,
}: AssetFixtures) {
	return Store.run(ui, async () => {
		// Act: Index all assets.
		const assets = [...(await index(client)).values()];

		// Assert: Were all assets indexed?
		expect(assets).toContainEqual(
			expect.objectContaining({
				name: state.subfolderName,
				parent_uid: state.parentFolder!.uid,
				uid: state.subFolder!.uid,
			}),
		);

		expect(assets).toContainEqual(
			expect.objectContaining({
				name: state.folderName,
				parent_uid: null,
				uid: state.parentFolder!.uid,
			}),
		);

		expect(assets).toContainEqual(
			expect.objectContaining({
				name: state.folderName,
				parent_uid: null,
				uid: state.parentFolder!.uid,
			}),
		);

		expect(assets).toContainEqual(
			expect.objectContaining({
				description: 'This is another test asset.',
				file_size: '10778',
				filename: 'mossflower.webp',
				parent_uid: state.subFolder!.uid,
				tags: ['test', 'asset', 'another'],
				title: 'Another Test Asset',
				uid: state.mossflower!.uid,
			}),
		);

		expect(assets).toContainEqual(
			expect.objectContaining({
				description: 'This is also a test asset.',
				file_size: '21704',
				filename: 'mattimeo.webp',
				parent_uid: state.parentFolder!.uid,
				tags: ['test', 'asset'],
				title: 'Test Asset: Mattimeo',
				uid: state.mattimeo!.uid,
			}),
		);

		expect(assets).toContainEqual(
			expect.objectContaining({
				description: 'This is a test asset.',
				file_size: '12332',
				filename: 'martin.webp',
				parent_uid: state.parentFolder!.uid,
				tags: ['test', 'asset'],
				title: 'Test Asset: Martin',
				uid: state.martin!.uid,
			}),
		);
	});
}
