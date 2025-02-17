import { Store } from '#cli/schema/lib/SchemaUi.js';
import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pulledEntries({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const pulled = resolve(currentFixturePath, 'entries');
		const original = resolve(originalFixturePath, 'entries');

		const load = async (dir: string, contentType: string, name: string) => {
			const resolved = resolve(dir, contentType, `${name}.yaml`);
			const parsed = await yaml.load(await readFile(resolved, 'utf8'));
			return parsed as Record<string, unknown>;
		};

		const [
			pulledFeast,
			pulledWorkshop,
			pulledHomePage,
			originalFeast,
			originalWorkshop,
			originalHomePage,
		] = await Promise.all([
			load(pulled, 'event', 'Autumn Feast and Social'),
			load(pulled, 'event', 'Community Gardening Workshop'),
			load(pulled, 'home_page', 'Mice Community Hub'),
			load(original, 'event', 'Autumn Feast and Social'),
			load(original, 'event', 'Community Gardening Workshop'),
			load(original, 'home_page', 'Mice Community Hub'),
		]);

		// Assert
		await expect(pulled).directoryListingToMatch(original);

		expect(pulledFeast).toEqual({
			...originalFeast,
			main_image: { $beacon: { asset: 'events/Salamandastron.webp' } },
			related_events: [
				{ $beacon: { reference: 'event/Community Gardening Workshop' } },
			],
		});

		expect(pulledWorkshop).toEqual({
			...originalWorkshop,
			main_image: { $beacon: { asset: 'events/Bellmaker.webp' } },
			related_events: [
				{ $beacon: { reference: 'event/Autumn Feast and Social' } },
			],
		});

		expect(pulledHomePage).toEqual({
			...originalHomePage,
			featured_events: [
				{ $beacon: { reference: 'event/Community Gardening Workshop' } },
				{ $beacon: { reference: 'event/Autumn Feast and Social' } },
			],
			header_image: { $beacon: { asset: 'Mariel.webp' } },
		});
	});
}
