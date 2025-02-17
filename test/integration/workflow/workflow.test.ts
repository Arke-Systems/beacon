import clear from '#cli/schema/clear.js';
import inspector from 'node:inspector/promises';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import WorkflowTestContext from './lib/WorkflowTestContext.js';
import addContentType from './tests/addContentType.js';
import canPullChanges from './tests/canPullChanges.js';
import canPushChanges from './tests/canPushChanges.js';
import canPushNoChanges from './tests/canPushNoChanges.js';
import deleteContentType from './tests/deleteContentType.js';
import mutateGlobalField from './tests/mutateGlobalField.js';
import pulledAssets from './tests/pulledAssets.js';
import pulledEntries from './tests/pulledEntries.js';
import pulledGlobalFields from './tests/pulledGlobalFields.js';
import pulledTaxonomies from './tests/pulledTaxonomies.js';
import pushedAssets from './tests/pushedAssets.js';
import pushedContentTypes from './tests/pushedContentTypes.js';
import pushedEntries from './tests/pushedEntries.js';
import pushedGlobalFields from './tests/pushedGlobalFields.js';
import pushedTaxonomies from './tests/pushedTaxonomies.js';

const longTest = 30000;

describe(
	'Developer Workflow',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const ctx = new WorkflowTestContext();
		beforeAll(async () => clear(ctx.client, ctx.ui), longTest);
		afterAll(async () => ctx[Symbol.asyncDispose]());

		ctx.test('can push changes to an empty stack', canPushChanges);
		ctx.test('assets were pushed accurately', pushedAssets);
		ctx.test('taxonomies were pushed accurately', pushedTaxonomies);
		ctx.test('global fields were pushed accurately', pushedGlobalFields);
		ctx.test('content types were pushed accurately', pushedContentTypes);
		ctx.test('entries were pushed accurately', pushedEntries);

		ctx.test('Arrange: create a clone of the fixture', async () => {
			await expect(ctx.createFixtureClone()).resolves.not.toThrow();
		});

		ctx.test('can pull changes into an empty file system', canPullChanges);
		ctx.test('assets were pulled accurately', pulledAssets);
		ctx.test('taxonomies were pulled accurately', pulledTaxonomies);
		ctx.test('global fields were pulled accurately', pulledGlobalFields);
		ctx.test('entries were pulled accurately', pulledEntries);
		ctx.test('pushing results in no modifications', canPushNoChanges);

		ctx.test('can mutate a global field', mutateGlobalField);
		ctx.test('can add a content type', addContentType);
		ctx.test('can delete a content type', deleteContentType);
	},
);
