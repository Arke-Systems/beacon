import { Store } from '#cli/schema/lib/SchemaUi.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';
import loadEntry from '../lib/loadEntry.js';

export default async function pulledEntries({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const pulled = resolve(currentFixturePath, 'entries');
		const original = resolve(originalFixturePath, 'entries');

		const [
			pulledFeast,
			pulledWorkshop,
			pulledHomePage,
			originalFeast,
			originalWorkshop,
			originalHomePage,
		] = await Promise.all([
			loadEntry(currentFixturePath, 'event', 'Autumn Feast and Social'),
			loadEntry(currentFixturePath, 'event', 'Community Gardening Workshop'),
			loadEntry(currentFixturePath, 'home_page', 'Mice Community Hub'),
			loadEntry(originalFixturePath, 'event', 'Autumn Feast and Social'),
			loadEntry(originalFixturePath, 'event', 'Community Gardening Workshop'),
			loadEntry(originalFixturePath, 'home_page', 'Mice Community Hub'),
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
