import readYaml from '#cli/fs/readYaml.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { readdir } from 'node:fs/promises';
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

			const [pulledContent, fixtureContent] = await Promise.all([
				readYaml(pulledPath),
				readYaml(fixturePath),
			]);

			expect(pulledContent).toEqual(fixtureContent);
		}
	});
}
