import type { Schema } from '#cli/cs/Types.js';
import { isSchema } from '#cli/cs/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import writeYaml from '#cli/fs/writeYaml.js';
import schemaDirectory from '#cli/schema/global-fields/schemaDirectory.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import push from '#cli/schema/push.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function mutateGlobalField({
	client,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		await addKeywordsToSeo();

		// Act
		const result = await push(client);

		// Assert
		expect(result).toBeErrorFreeTransferResults();
		const globalFieldsResult = result.get('Global Fields')!;

		if (globalFieldsResult.status !== 'fulfilled') {
			throw new Error('Global Fields push failed');
		}

		expect([...globalFieldsResult.value.updated]).toEqual(['seo']);
	});
}

async function loadSeo() {
	const globalFields = schemaDirectory();
	const seoPath = resolve(globalFields, 'seo.yaml');
	const seo = await readYaml(seoPath);

	if (!isSchema(seo)) {
		throw new Error('SEO schema is not valid');
	}

	return seo;
}

async function writeSeo(seo: Schema) {
	const globalFields = schemaDirectory();
	const seoPath = resolve(globalFields, 'seo.yaml');
	await writeYaml(seoPath, seo);
}

async function addKeywordsToSeo() {
	const seo = await loadSeo();
	const { schema } = seo;

	if (!Array.isArray(schema)) {
		throw new Error('SEO schema is not valid');
	}

	schema.push({
		data_type: 'text',
		display_name: 'Keywords',
		error_messages: { format: '' },
		field_metadata: { default_value: '', description: '', version: 3 },
		format: '',
		mandatory: false,
		multiple: false,
		non_localizable: false,
		uid: 'keywords',
		unique: false,
	});

	await writeSeo(seo);
}
