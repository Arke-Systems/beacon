import type Client from '#cli/cs/api/Client.js';
import readYaml from '#cli/fs/readYaml.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { TestFixtures } from '../../lib/TestContext.js';

export default async function pullTaxonomy({
	client,
	currentFixturePath,
	ui,
}: TestFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		await addNewTaxonomy(client);

		ui.options.schema.taxonomies.set('new_taxonomy', 'only taxonomy');

		// Act
		const result = await pull(client);

		// Assert
		expect(result).toBeErrorFreeTransferResults();
		const taxonomyResult = result.get('Taxonomies')!;

		if (taxonomyResult.status !== 'fulfilled') {
			throw new Error('Taxonomy pull failed');
		}

		expect([...taxonomyResult.value.created]).toEqual(['new_taxonomy']);

		const expectedPath = resolve(
			currentFixturePath,
			'taxonomies',
			'new_taxonomy.yaml',
		);

		const parsed = await readYaml(expectedPath);

		expect(parsed).toEqual({
			taxonomy: {
				description: 'Taxonomy Description',
				name: 'New Taxonomy',
				uid: 'new_taxonomy',
			},
		});
	});
}

async function addNewTaxonomy(client: Client) {
	const x = await client.POST('/v3/taxonomies/', {
		body: {
			taxonomy: {
				description: 'Taxonomy Description',
				name: 'New Taxonomy',
				uid: 'new_taxonomy',
			},
		},
	});

	if (!x.response.ok) {
		throw new Error('Failed to create new taxonomy');
	}
}
