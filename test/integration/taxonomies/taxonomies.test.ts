import clear from '#cli/schema/clear.js';
import { rm } from 'node:fs/promises';
import inspector from 'node:inspector/promises';
import { afterAll, beforeAll, describe } from 'vitest';
import TestContext from '../lib/TestContext.js';
import pullTaxonomy from './tests/pullTaxonomy.js';
import pushTerms from './tests/pushTerms.js';

const longTest = 30000;

describe(
	'Taxonomies Workflow',
	{
		concurrent: false,
		sequential: true,
		...(inspector.url() ? {} : { timeout: longTest }),
	},
	() => {
		const ctx = new TestContext('.tmp/taxonomies');

		beforeAll(async () => clear(ctx.client, ctx.ui), longTest);

		afterAll(async () =>
			Promise.allSettled([
				ctx[Symbol.asyncDispose](),
				rm(ctx.originalFixturePath, { force: true, recursive: true }),
			]),
		);

		ctx.test('can pull a new taxonomy', pullTaxonomy);
		ctx.test('can push terms into an existing taxonomy', pushTerms);
	},
);
