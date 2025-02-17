import { Store } from '#cli/schema/lib/SchemaUi.js';
import yaml from 'js-yaml';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pulledTaxonomies({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const pulled = resolve(currentFixturePath, 'taxonomies');
		const original = resolve(originalFixturePath, 'taxonomies');
		const names = await readdir(pulled, { recursive: true });

		// Assert
		await expect(pulled).directoryListingToMatch(original);

		for (const name of names) {
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
