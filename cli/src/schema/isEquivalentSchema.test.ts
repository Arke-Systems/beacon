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

test('Schemas with different labels are not equivalent', () => {
	const baseSchema: Schema = {
		description: '',
		options: {
			is_page: false,
			singleton: false,
			sub_title: [],
			title: 'title',
		},
		schema: [
			{
				data_type: 'text',
				display_name: 'Title',
				mandatory: true,
				multiple: false,
				non_localizable: false,
				uid: 'title',
				unique: true,
			},
		],
		title: 'Test',
		uid: 'test',
	};

	const schemaWithLabels: Schema = {
		...baseSchema,
		labels: ['label1', 'label2'],
	};

	expect(isEquivalentSchema(baseSchema, schemaWithLabels)).toBe(false);
});

test('Schemas with same labels are equivalent', () => {
	const schema1: Schema = {
		description: '',
		labels: ['label1', 'label2'],
		options: {
			is_page: false,
			singleton: false,
			sub_title: [],
			title: 'title',
		},
		schema: [
			{
				data_type: 'text',
				display_name: 'Title',
				mandatory: true,
				multiple: false,
				non_localizable: false,
				uid: 'title',
				unique: true,
			},
		],
		title: 'Test',
		uid: 'test',
	};

	const schema2: Schema = {
		description: '',
		labels: ['label1', 'label2'],
		options: {
			is_page: false,
			singleton: false,
			sub_title: [],
			title: 'title',
		},
		schema: [
			{
				data_type: 'text',
				display_name: 'Title',
				mandatory: true,
				multiple: false,
				non_localizable: false,
				uid: 'title',
				unique: true,
			},
		],
		title: 'Test',
		uid: 'test',
	};

	expect(isEquivalentSchema(schema1, schema2)).toBe(true);
});
