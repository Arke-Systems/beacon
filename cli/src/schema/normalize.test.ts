import type { Schema } from '#cli/cs/Types.js';
import readFixture from '#test/fixtures/readFixture';
import getSnapshotPath from '#test/snapshots/getSnapshotPath';
import { expect, test } from 'vitest';
import { parse, stringify } from 'yaml';
import normalize from './normalize.js';

test('Normalization of an exported schema should match snapshot', async () => {
	// Arrange
	const fixtureYaml = await readFixture('navigation-export.yaml');
	const exportFixture = parse(fixtureYaml) as Schema;

	// Act
	const normalized = normalize(exportFixture);

	// Assert
	const output = stringify(normalized, { sortMapEntries: true });
	const snapPath = getSnapshotPath('normalize-exported-schema.yaml');
	await expect(output).toMatchFileSnapshot(snapPath);
});

test('Normalization preserves labels when present', () => {
	// Arrange
	const schemaWithLabels: Schema = {
		description: 'Test content type',
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

	// Act
	const normalized = normalize(schemaWithLabels);

	// Assert
	expect(normalized.labels).toEqual(['label1', 'label2']);
});

test('Normalization preserves empty labels array', () => {
	// Arrange
	const schemaWithEmptyLabels: Schema = {
		description: 'Test content type',
		labels: [],
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

	// Act
	const normalized = normalize(schemaWithEmptyLabels);

	// Assert
	expect(normalized.labels).toEqual([]);
});

test('Normalization does not add labels when absent', () => {
	// Arrange
	const schemaWithoutLabels: Schema = {
		description: 'Test content type',
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

	// Act
	const normalized = normalize(schemaWithoutLabels);

	// Assert
	expect(normalized).not.toHaveProperty('labels');
});
