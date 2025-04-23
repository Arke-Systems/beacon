import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import index from '#cli/cs/entries/index.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import type { Schema } from '#cli/cs/Types.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect } from 'node:util';
import { expect } from 'vitest';
import loadContentType from '../lib/loadContentType.js';
import loadEntry from '../lib/loadEntry.js';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedEntries({
	assets,
	client,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema> = new Map();
		const contentTypes = await loadContentTypes(originalFixturePath);
		const originals = await loadEntries(originalFixturePath);

		const homePageEntries = await index(
			client,
			globalFieldsByUid,
			contentTypes.homePage,
		);

		expect(homePageEntries.size).toBe(1);
		const homePage = [...homePageEntries.values()][0]!;

		const eventEntries = await index(
			client,
			globalFieldsByUid,
			contentTypes.event,
		);

		const events = [...eventEntries.values()];
		const feast = events.find(byTitle('Autumn Feast and Social'));
		const workshop = events.find(byTitle('Community Gardening Workshop'));

		// Justification: Meaning is obvious.
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		expect(events).toHaveLength(2);
		expect(events).toEqual(expect.arrayContaining([feast]));
		expect(events).toEqual(expect.arrayContaining([workshop]));

		const basicEntry = {
			ACL: expect.any(Object),
			_in_progress: false,
			_version: expect.any(Number),
			created_at: expect.isoDateString(),
			created_by: expect.any(String),
			locale: 'en-us',
			tags: [],
			uid: expect.any(String),
			updated_at: expect.isoDateString(),
			updated_by: expect.any(String),
		};

		expect(feast).toEqual({
			...originals.feast,
			...basicEntry,
			main_image: attachedAsset(assets.get('sala')!),
			related_events: [{ _content_type_uid: 'event', uid: workshop!.uid }],
			travel_info: {
				_version: expect.any(Number),
				attrs: {},
				children: [
					{
						attrs: {},
						children: [
							{
								text: 'Hike down from the rim (approximately 3 miles or 5 km) to Skeleton Point, where the River comes into view.',
							},
						],
						type: 'p',
						uid: expect.any(String),
					},
					{
						attrs: {},
						children: [
							{
								text: 'From there, follow the trail down into the inner gorge, which involves a steep descent through switchbacks.',
							},
						],
						type: 'p',
						uid: expect.any(String),
					},
				],
				type: 'doc',
				uid: expect.any(String),
			},
		});

		expect(workshop).toEqual({
			...originals.workshop,
			...basicEntry,
			main_image: attachedAsset(assets.get('bellmaker')!),
			related_events: [{ _content_type_uid: 'event', uid: feast!.uid }],
		});

		const main = blocksHaveRandomMetadata(homePage.main);

		expect(homePage).toEqual({
			...originals.homePage,
			...basicEntry,
			featured_events: [
				{ _content_type_uid: 'event', uid: workshop!.uid },
				{ _content_type_uid: 'event', uid: feast!.uid },
			],

			header_image: attachedAsset(assets.get('mariel')!),

			links: [
				{
					_metadata: expect.any(Object),
					description: '',
					link: {
						href: '/skarlath',
						title: 'Skarlath',
					},
					thumbnail: [attachedAsset(assets.get('skarlath')!)],
				},
			],

			main: [
				main[0],
				main[1],
				{
					carousel: {
						...main[2]!.carousel,
						images: [
							attachedAsset(assets.get('mariel')!),
							attachedAsset(assets.get('bellmaker')!),
						],
					},
				},
			],
		});
	});
}

const byTitle = (title: string) => (x: Entry) => x.title === title;

function attachedAsset(asset: RawAssetItem) {
	if (!isRawAsset(asset)) {
		throw new TypeError('Expected asset, received ' + inspect(asset));
	}

	return { ...asset, ACL: [] };
}

function blocksHaveRandomMetadata(blocks: unknown) {
	if (!Array.isArray(blocks)) {
		throw new TypeError('Expected array, received ' + inspect(blocks));
	}

	return blocks.map((block) => {
		if (!isRecord(block)) {
			throw new TypeError('Expected object, received ' + inspect(block));
		}

		const [entry] = Object.entries(block);
		if (!entry) {
			throw new Error('Empty block');
		}

		const [key, value] = entry;
		if (!isRecord(value)) {
			throw new TypeError('Expected object, received ' + inspect(value));
		}

		return {
			[key]: { ...value, _metadata: expect.any(Object) },
		};
	});
}

async function loadContentTypes(fixturePath: string) {
	const [homePage, event] = await Promise.all([
		loadContentType(fixturePath, 'home_page'),
		loadContentType(fixturePath, 'event'),
	]);

	return { event, homePage };
}

async function loadEntries(fixturePath: string) {
	const [feast, homePage, workshop] = await Promise.all([
		loadEntry(fixturePath, 'event', 'Autumn Feast and Social'),
		loadEntry(fixturePath, 'home_page', 'Mice Community Hub'),
		loadEntry(fixturePath, 'event', 'Community Gardening Workshop'),
	]);

	return { feast, homePage, workshop };
}
