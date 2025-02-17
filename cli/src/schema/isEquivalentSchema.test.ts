import type { Schema } from '#cli/cs/Types.js';
import readFixture from '#test/fixtures/readFixture';
import yaml from 'js-yaml';
import { expect, test } from 'vitest';
import isEquivalentSchema from './isEquivalentSchema.js';

test('Equal schemas are equal', () => {
	const simpleSchema = { schema: [], title: 'title', uid: 'uid' };
	expect(isEquivalentSchema(simpleSchema, simpleSchema)).toBe(true);
});

['navigation'].forEach((fixtureName) =>
	test(`Fixtures are equivalent: ${fixtureName}`, async () => {
		const [x, y] = await Promise.all([
			readFixture(`${fixtureName}-read.yaml`),
			readFixture(`${fixtureName}-export.yaml`),
		]);

		const read = yaml.load(x) as Schema;
		const exportFixture = yaml.load(y) as Schema;

		expect(isEquivalentSchema(read, exportFixture)).toBe(true);
	}),
);
