import { Store } from '#cli/schema/lib/SchemaUi.js';
import yaml from 'js-yaml';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pulledAssets({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const pulled = resolve(currentFixturePath, 'assets');
		const original = resolve(originalFixturePath, 'assets');

		// Assert
		await expect(pulled).directoryListingToMatch(original);
		const names = await readdir(pulled, { recursive: true });

		for (const name of names.filter((x) => x.endsWith('.webp'))) {
			const pulledPath = resolve(pulled, name);
			const fixturePath = resolve(original, name);
			await expect(pulledPath).fileToBeBinaryEqualTo(fixturePath);
		}

		for (const name of names.filter((x) => x.endsWith('.yaml'))) {
			const pulledPath = resolve(pulled, name);
			const fixturePath = resolve(original, name);

			const [pulledRaw, fixtureRaw] = await Promise.all([
				readFile(pulledPath, 'utf8'),
				readFile(fixturePath, 'utf8'),
			]);

			const pulledParsed = yaml.load(pulledRaw);
			const fixtureParsed = yaml.load(fixtureRaw);

			expect(pulledParsed).toEqual(fixtureParsed);
		}
	});
}
