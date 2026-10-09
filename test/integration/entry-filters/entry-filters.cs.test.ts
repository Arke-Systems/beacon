import type { Config } from '#cli/cfg/Config.schema.yaml';
import transformSchemaConfig from '#cli/cfg/transform/transformSchemaConfig.js';
import type Client from '#cli/cs/api/Client.js';
import indexContentTypes from '#cli/cs/content-types/index.js';
import indexEntries from '#cli/cs/entries/index.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import indexGlobalFields from '#cli/cs/global-fields/index.js';
import writeYaml from '#cli/fs/writeYaml.js';
import clear from '#cli/schema/clear.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import push from '#cli/schema/push.js';
import HandledError from '#cli/ui/HandledError.js';
import { cp, readdir, rm } from 'node:fs/promises';
import inspector from 'node:inspector/promises';
import { resolve } from 'node:path';
import { afterAll, beforeEach, describe, expect } from 'vitest';
import TestContext from '../lib/TestContext.js';
import type TestPushUiContext from '../lib/TestPushUiContext.js';
import loadEntry from '../workflow/lib/loadEntry.js';

const longTest = 30000;
const homePageTitle = 'Mice Community Hub';
const autumnTitle = 'Autumn Feast and Social';
const workshopTitle = 'Community Gardening Workshop';

describe(
	'Entry Filters',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const ctx = new TestContext('fixtures/developer-workflow');

		beforeEach(async () => {
			await clear(ctx.client, ctx.ui);
			await ctx.createFixtureClone();
		}, longTest);

		afterAll(async () => ctx[Symbol.asyncDispose]());

		ctx.test(
			'excludes entries from pull while serializing references to them',
			async ({ client, currentFixturePath, originalFixturePath, ui }) =>
				Store.run(ui, async () => {
					// Arrange
					await seedStack(client, currentFixturePath, originalFixturePath);
					await rm(resolve(currentFixturePath, 'entries'), {
						force: true,
						recursive: true,
					});
					configureEntryFilters(ui, { exclude: ['event'] });

					// Act
					const results = await pull(client);

					// Assert
					expect(results).toBeErrorFreeTransferResults();
					expect(results.has('Home Page Entries')).toBe(true);
					expect(results.has('Event Entries')).toBe(false);
					expect(await readdir(resolve(currentFixturePath, 'entries'))).toEqual(
						['home_page'],
					);

					const homePage = await loadEntry(
						currentFixturePath,
						'home_page',
						homePageTitle,
					);

					expect(homePage.featured_events).toEqual([
						{ $beacon: { reference: `event/${workshopTitle}` } },
						{ $beacon: { reference: `event/${autumnTitle}` } },
					]);
				}),
			longTest,
		);

		ctx.test(
			'pushes included entries without changing excluded referenced entries',
			async ({ client, currentFixturePath, originalFixturePath, ui }) =>
				Store.run(ui, async () => {
					// Arrange
					await seedStack(client, currentFixturePath, originalFixturePath);

					const homePage = await loadEntry(
						currentFixturePath,
						'home_page',
						homePageTitle,
					);
					const autumn = await loadEntry(
						currentFixturePath,
						'event',
						autumnTitle,
					);
					const changedDescription =
						'<p>This excluded change must not be pushed.</p>';

					await Promise.all([
						writeYaml(
							entryPath(currentFixturePath, 'home_page', homePageTitle),
							{
								...homePage,
								show_featured_events: false,
							},
						),
						writeYaml(entryPath(currentFixturePath, 'event', autumnTitle), {
							...autumn,
							description: changedDescription,
						}),
						rm(entryPath(currentFixturePath, 'event', workshopTitle)),
					]);

					configureEntryFilters(ui, { include: ['home_page'] });

					// Act
					const results = await push(client);

					// Assert
					expect(results).toBeErrorFreeTransferResults();
					expect(results.has('Home Page entries')).toBe(true);
					expect(results.has('Event entries')).toBe(false);

					const { events, homePages } = await remoteEntries(client);
					const remoteAutumn = findByTitle(events, autumnTitle);
					const remoteWorkshop = findByTitle(events, workshopTitle);
					const remoteHomePage = findByTitle(homePages, homePageTitle);

					expect(remoteAutumn.description).toBe(autumn.description);
					expect(remoteAutumn.description).not.toBe(changedDescription);
					expect(remoteHomePage.show_featured_events).toBe(false);
					expect(remoteHomePage.featured_events).toEqual([
						{ _content_type_uid: 'event', uid: remoteWorkshop.uid },
						{ _content_type_uid: 'event', uid: remoteAutumn.uid },
					]);
				}),
			longTest,
		);

		ctx.test(
			'reports a missing reference to an included entry',
			async ({ client, currentFixturePath, originalFixturePath, ui }) =>
				Store.run(ui, async () => {
					// Arrange
					await seedStack(client, currentFixturePath, originalFixturePath);

					const homePage = await loadEntry(
						currentFixturePath,
						'home_page',
						homePageTitle,
					);
					const missingTitle = 'Does not exist';

					await writeYaml(
						entryPath(currentFixturePath, 'home_page', homePageTitle),
						{
							...homePage,
							featured_events: [
								{ $beacon: { reference: `event/${missingTitle}` } },
							],
						},
					);
					configureEntryFilters(ui, { include: ['event', 'home_page'] });

					// Act
					const results = await push(client);

					// Assert
					const references = results.get('References');
					expect(references?.status).toBe('fulfilled');

					if (references?.status !== 'fulfilled') {
						throw new Error('Expected fulfilled reference results.');
					}

					const error = references.value.errored.get(
						`home_page/${homePageTitle}`,
					);
					expect(error).toBeInstanceOf(HandledError);
					expect(error).toHaveProperty(
						'message',
						`Missing reference: home_page/${homePageTitle} -> event/${missingTitle}`,
					);
				}),
			longTest,
		);
	},
);

type SchemaConfig = NonNullable<Config['schema']>;
type EntryFilters = NonNullable<SchemaConfig['entries']>;

function configureEntryFilters(ui: TestPushUiContext, filters: EntryFilters) {
	const isIncluded = transformSchemaConfig(
		{ entries: filters },
		undefined,
	)?.entries?.isIncluded;

	if (!isIncluded) {
		throw new Error('Expected transformed entry filters.');
	}

	ui.options.schema.entries.isIncluded = isIncluded;
}

async function seedStack(
	client: Client,
	currentFixturePath: string,
	originalFixturePath: string,
) {
	await cp(originalFixturePath, currentFixturePath, { recursive: true });
	const results = await push(client);
	expect(results).toBeErrorFreeTransferResults();
}

function entryPath(root: string, contentTypeUid: string, title: string) {
	return resolve(root, 'entries', contentTypeUid, `${title}.yaml`);
}

async function remoteEntries(client: Client) {
	const [contentTypes, globalFields] = await Promise.all([
		indexContentTypes(client),
		indexGlobalFields(client),
	]);
	const event = contentTypes.get('event');
	const homePage = contentTypes.get('home_page');

	if (!event || !homePage) {
		throw new Error('Expected event and home_page content types.');
	}

	const [events, homePages] = await Promise.all([
		indexEntries(client, globalFields, event),
		indexEntries(client, globalFields, homePage),
	]);

	return { events, homePages };
}

function findByTitle(entries: ReadonlyMap<string, Entry>, title: string) {
	const entry = [...entries.values()].find(
		(candidate) => candidate.title === title,
	);

	if (!entry) {
		throw new Error(`Expected remote entry: ${title}`);
	}

	return entry;
}
