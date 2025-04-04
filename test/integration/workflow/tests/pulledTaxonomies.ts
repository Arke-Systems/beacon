import readYaml from '#cli/fs/readYaml.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { readdir } from 'node:fs/promises';
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

			const [pulledParsed, fixtureParsed] = await Promise.all([
				readYaml(pulledPath),
				readYaml(fixturePath),
			]);

			expect(pulledParsed).toEqual(fixtureParsed);
		}
	});
}
