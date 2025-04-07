import readFixture from '#test/fixtures/readFixture.js';
import getSnapshotPath from '#test/snapshots/getSnapshotPath.js';
import TempFolder from '#test/util/TempFolder.js';
import TestProjectUrl from '#test/util/TestProjectUrl.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import writeYaml from './writeYaml.js';

describe(writeYaml.name, () => {
	it('can serialize troublesome unicode characters', async () => {
		// Arrange
		const tempPath = fileURLToPath(new URL('.tmp', TestProjectUrl));
		await using tempFolder = await TempFolder.create(tempPath);
		const outputName = 'output.yaml';
		const absolutePath = resolve(tempFolder.absPath, outputName);
		const content = await readJsonC('serialization/leading-unicode.jsonc');

		// Act
		await writeYaml(absolutePath, content);
		const actual = await readFile(absolutePath, 'utf-8');

		// Assert
		const snapPath = getSnapshotPath('leading-unicode.yaml');
		await expect(actual).toMatchFileSnapshot(snapPath);
	});
});

async function readJsonC(fixturePath: string): Promise<unknown> {
	const raw = await readFixture(fixturePath);
	const withoutComments = raw.replace(/\/\/.*|\/\*[\s\S]*?\*\//gu, '').trim();
	return JSON.parse(withoutComments);
}
