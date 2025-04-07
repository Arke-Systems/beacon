import type { Schema } from '#cli/cs/Types.js';
import readFixture from '#test/fixtures/readFixture';
import { expect, test } from 'vitest';
import { parse } from 'yaml';
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

		const read = parse(x) as Schema;
		const exportFixture = parse(y) as Schema;

		expect(isEquivalentSchema(read, exportFixture)).toBe(true);
	}),
);
