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
