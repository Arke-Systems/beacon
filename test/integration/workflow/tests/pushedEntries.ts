import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import index from '#cli/cs/entries/index.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';
import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspect } from 'node:util';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pushedEntries({
	assets,
	client,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const original = resolve(originalFixturePath, 'entries');

		const load = async (dir: string, contentType: string, name: string) => {
			const resolved = resolve(dir, contentType, `${name}.yaml`);
			const parsed = await yaml.load(await readFile(resolved, 'utf8'));
			return parsed as Record<string, unknown>;
		};

		const [originalFeast, originalWorkshop, originalHomePage] =
			await Promise.all([
				load(original, 'event', 'Autumn Feast and Social'),
				load(original, 'event', 'Community Gardening Workshop'),
				load(original, 'home_page', 'Mice Community Hub'),
			]);

		const homePageEntries = await index(client, 'home_page');
		expect(homePageEntries.size).toBe(1);
		const homePage = [...homePageEntries.values()][0]!;

		const eventEntries = await index(client, 'event');
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
			...originalFeast,
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
			...originalWorkshop,
			...basicEntry,
			main_image: attachedAsset(assets.get('bellmaker')!),
			related_events: [{ _content_type_uid: 'event', uid: feast!.uid }],
		});

		const main = blocksHaveRandomMetadata(homePage.main);

		expect(homePage).toEqual({
			...originalHomePage,
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
