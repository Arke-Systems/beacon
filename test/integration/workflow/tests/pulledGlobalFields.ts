import readYaml from '#cli/fs/readYaml.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pulledGlobalFields({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const pulled = resolve(currentFixturePath, 'global-fields');
		const original = resolve(originalFixturePath, 'global-fields');

		const load = async (name: string) =>
			readYaml(resolve(pulled, `${name}.yaml`));

		const [contact, seo] = await Promise.all([load('contact'), load('seo')]);

		// Assert
		await expect(pulled).directoryListingToMatch(original);

		const basicGlobalField = { description: '' };

		const basicField = {
			error_messages: { format: '' },
			field_metadata: {
				default_value: '',
				description: '',
				version: expect.any(Number),
			},
			format: '',
			mandatory: false,
			multiple: false,
			non_localizable: false,
			unique: false,
		};

		expect(contact).toEqual({
			...basicGlobalField,
			schema: [
				{
					...basicField,
					data_type: 'text',
					display_name: 'Email',
					format: '^\\S+@\\S+\\.\\S+$',
					uid: 'email',
				},
				{
					...basicField,
					data_type: 'text',
					display_name: 'Phone',
					uid: 'phone',
				},
			],
			title: 'Contact',
			uid: 'contact',
		});

		expect(seo).toEqual({
			...basicGlobalField,
			schema: [
				{
					...basicField,
					data_type: 'text',
					display_name: 'Page Title',
					uid: 'page_title',
				},
				{
					...basicField,
					data_type: 'text',
					display_name: 'SEO Description',
					field_metadata: {
						...basicField.field_metadata,
						multiline: true,
					},
					uid: 'seo_description',
				},
			],
			title: 'SEO',
			uid: 'seo',
		});
	});
}
