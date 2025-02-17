import clear from '#cli/schema/clear.js';
import { rm } from 'node:fs/promises';
import inspector from 'node:inspector/promises';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe } from 'vitest';
import TestProjectUrl from '../../util/TestProjectUrl.js';
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
		const fixturePath = fileURLToPath(
			new URL('.tmp/taxonomies', TestProjectUrl),
		);

		const ctx = new TestContext(fixturePath);

		beforeAll(async () => clear(ctx.client, ctx.ui), longTest);

		afterAll(async () =>
			Promise.allSettled([
				ctx[Symbol.asyncDispose](),
				rm(fixturePath, { force: true, recursive: true }),
			]),
		);

		ctx.test('can pull a new taxonomy', pullTaxonomy);
		ctx.test('can push terms into an existing taxonomy', pushTerms);
	},
);
