import type { Schema } from '#cli/cs/Types.js';
import readFixture from '#test/fixtures/readFixture';
import getSnapshotPath from '#test/snapshots/getSnapshotPath';
import yaml from 'js-yaml';
import prettier from 'prettier';
import { expect, test } from 'vitest';
import normalize from './normalize.js';

test('Normalization of an exported schema should match snapshot', async () => {
	// Arrange
	const fixtureYaml = await readFixture('navigation-export.yaml');
	const exportFixture = yaml.load(fixtureYaml) as Schema;

	// Act
	const normalized = normalize(exportFixture);

	// Assert
	const ugly = yaml.dump(normalized, { sortKeys: true });
	const snapPath = getSnapshotPath('normalize-exported-schema.yaml');
	const opts = await prettier.resolveConfig(snapPath);
	const pretty = await prettier.format(ugly, { ...opts, parser: 'yaml' });
	await expect(pretty).toMatchFileSnapshot(snapPath);
});
