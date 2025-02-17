import exportTaxonomy from '#cli/cs/taxonomies/export.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import yaml from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { TestFixtures } from '../../lib/TestContext.js';

export default async function pushTerms({
	client,
	currentFixturePath,
	ui,
}: TestFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		await updateSerializationToIncludeTerms(currentFixturePath);
		ui.options.schema.taxonomies.delete('new_taxonomy');

		// Act
		const results = await push(client);

		// Assert
		expect(results).toBeErrorFreeTransferResults();

		const value = await exportTaxonomy(client, 'new_taxonomy');

		expect(value).toEqual({
			taxonomy: {
				description: 'Taxonomy Description',
				name: 'New Taxonomy',
				uid: 'new_taxonomy',
			},
			terms: expect.arrayContaining([
				{
					name: 'Term 2.2.2',
					parent_uid: 'term_2_2',
					uid: 'term_2_2_2',
				},
			]),
		});
	});
}

async function updateSerializationToIncludeTerms(fixturePath: string) {
	const path = resolve(fixturePath, 'taxonomies', 'new_taxonomy.yaml');
	const existing = yaml.load(await readFile(path, 'utf8'));

	const term = (name: string, ...children: unknown[]) => ({
		name,
		uid: name.toLowerCase().replace(/\s|\./giu, '_'),
		...(children.length ? { children } : {}),
	});

	await writeFile(
		path,
		yaml.dump({
			...(existing as Record<string, unknown>),
			terms: [
				term('Term 1', term('Term 1.1'), term('Term 1.2'), term('Term 1.3')),
				term(
					'Term 2',
					term('Term 2.1'),
					term(
						'Term 2.2',
						term('Term 2.2.1'),
						term('Term 2.2.2'),
						term('Term 2.2.3'),
					),
					term('Term 2.3'),
				),
				term('Term 3', term('Term 3.1'), term('Term 3.2'), term('Term 3.3')),
			],
		}),
		'utf8',
	);
}
