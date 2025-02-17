import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import { isRawAsset, isRawFolder } from '#cli/cs/assets/Types.js';
import index from '#cli/cs/assets/index.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedAssets({
	assets,
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const csAssets = [...(await index(client)).values()];
		const eventsFolder = csAssets.find(folderByName('events'));
		const linksFolder = csAssets.find(folderByName('links'));
		const sala = csAssets.find(assetByName('Salamandastron.webp'));
		const bellmaker = csAssets.find(assetByName('Bellmaker.webp'));
		const mariel = csAssets.find(assetByName('Mariel.webp'));
		const skarlath = csAssets.find(assetByName('Skarlath_&_Sunflash.webp'));

		const basicAssetItem = {
			ACL: expect.any(Object),
			_version: expect.any(Number),
			created_at: expect.isoDateString(),
			created_by: expect.any(String),
			tags: [],
			uid: expect.any(String),
			updated_at: expect.isoDateString(),
			updated_by: expect.any(String),
		};

		const basicAsset = {
			...basicAssetItem,
			content_type: 'image/webp',
			is_dir: false,
			url: expect.stringMatching(/^https:\/\/.*\.webp$/u),
		};

		expect(eventsFolder).toEqual({
			...basicAssetItem,
			content_type: 'application/vnd.contenstack.folder',
			is_dir: true,
			name: 'events',
			parent_uid: null,
		});

		expect(sala).toEqual({
			...basicAsset,
			file_size: '58456',
			filename: 'Salamandastron.webp',
			parent_uid: eventsFolder!.uid,
			title: 'Salamandastron.webp',
		});

		expect(bellmaker).toEqual({
			...basicAsset,
			file_size: '40274',
			filename: 'Bellmaker.webp',
			parent_uid: eventsFolder!.uid,
			title: 'Bellmaker.webp',
		});

		expect(mariel).toEqual({
			...basicAsset,
			file_size: '71498',
			filename: 'Mariel.webp',
			parent_uid: null,
			title: 'Mariel.webp',
		});

		expect(skarlath).toEqual({
			...basicAsset,
			file_size: '57186',
			filename: 'Skarlath_&_Sunflash.webp',
			parent_uid: linksFolder!.uid,
			title: 'Skarlath & Sunflash.webp',
		});

		// Justification: Meaning is obvious.
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		expect(csAssets).toHaveLength(6);

		assets.set('sala', sala!);
		assets.set('bellmaker', bellmaker!);
		assets.set('mariel', mariel!);
		assets.set('skarlath', skarlath!);
	});
}

const folderByName = (name: string) => (x: RawAssetItem) =>
	isRawFolder(x) && x.name === name;

const assetByName = (name: string) => (x: RawAssetItem) =>
	isRawAsset(x) && x.filename === name;
