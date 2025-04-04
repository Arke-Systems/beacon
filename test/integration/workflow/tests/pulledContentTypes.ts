import readYaml from '#cli/fs/readYaml.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function pulledContentTypes({
	currentFixturePath,
	originalFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		const pulled = resolve(currentFixturePath, 'content-types');
		const original = resolve(originalFixturePath, 'content-types');

		const load = async (name: string) =>
			readYaml(resolve(pulled, `${name}.yaml`));

		const [event, homePage] = await Promise.all([
			load('event'),
			load('home_page'),
		]);

		// Assert
		await expect(pulled).directoryListingToMatch(original);

		const basicContentType = {
			DEFAULT_ACL: expect.any(Array),
			SYS_ACL: expect.any(Object),
			_version: expect.any(Number),
			abilities: expect.any(Object),
			created_at: expect.isoDateString(),
			description: '',
			inbuilt_class: false,
			last_activity: expect.any(Object),
			maintain_revisions: true,
			options: {
				is_page: false,
				singleton: false,
				sub_title: [],
				title: 'title',
			},
			updated_at: expect.isoDateString(),
		};

		const basicField = {
			mandatory: false,
			multiple: false,
			non_localizable: false,
			unique: false,
		};

		expect(event).toEqual({
			...basicContentType,
			schema: [
				{
					...basicField,
					data_type: 'text',
					display_name: 'Title',
					field_metadata: {
						_default: true,
						version: expect.any(Number),
					},
					mandatory: true,
					uid: 'title',
					unique: true,
				},
				{
					...basicField,
					data_type: 'file',
					dimension: {
						height: { max: null, min: null },
						width: { max: null, min: null },
					},
					display_name: 'Main Image',
					field_metadata: {
						description: '',
						image: true,
						rich_text_type: 'standard',
					},
					uid: 'main_image',
				},
				{
					...basicField,
					data_type: 'isodate',
					display_name: 'Date',
					endDate: null,
					field_metadata: {
						default_value: {},
						description: '',
					},
					startDate: null,
					uid: 'date',
				},
				{
					...basicField,
					data_type: 'text',
					display_name: 'Description',
					field_metadata: {
						allow_rich_text: true,
						description: '',
						multiline: false,
						options: [],
						rich_text_type: 'advanced',
						version: expect.any(Number),
					},
					uid: 'description',
				},
				{
					...basicField,
					data_type: 'reference',
					display_name: 'Related Events',
					field_metadata: {
						ref_multiple: true,
						ref_multiple_content_types: true,
					},
					reference_to: ['event'],
					uid: 'related_events',
				},
				{
					...basicField,
					data_type: 'taxonomy',
					display_name: 'Taxonomy',
					error_messages: { format: '' },
					field_metadata: {
						default_value: '',
						description: '',
					},
					format: '',
					multiple: true,
					taxonomies: [
						{
							mandatory: true,
							max_terms: 1,
							multiple: true,
							non_localizable: false,
							taxonomy_uid: 'location',
						},
						{
							mandatory: false,
							multiple: true,
							non_localizable: false,
							taxonomy_uid: 'event_category',
						},
					],
					uid: 'taxonomies',
				},
			],
			title: 'Event',
			uid: 'event',
		});

		expect(homePage).toEqual({
			...basicContentType,
			options: {
				...basicContentType.options,
				singleton: true,
			},
			schema: [
				{
					...basicField,
					data_type: 'text',
					display_name: 'Title',
					field_metadata: {
						_default: true,
						version: expect.any(Number),
					},
					mandatory: true,
					uid: 'title',
					unique: true,
				},
				{
					...basicField,
					data_type: 'file',
					dimension: {
						height: { max: null, min: null },
						width: { max: null, min: null },
					},
					display_name: 'Header Image',
					field_metadata: {
						description: '',
						image: true,
						rich_text_type: 'standard',
					},
					uid: 'header_image',
				},
				{
					...basicField,
					data_type: 'text',
					display_name: 'Intro Text',
					field_metadata: {
						allow_rich_text: true,
						description: '',
						multiline: false,
						options: [],
						rich_text_type: 'advanced',
						version: expect.any(Number),
					},
					uid: 'intro_text',
				},
				{
					...basicField,
					data_type: 'reference',
					display_name: 'Featured Events',
					field_metadata: {
						ref_multiple: true,
						ref_multiple_content_types: true,
					},
					reference_to: ['event'],
					uid: 'featured_events',
				},
			],
			title: 'Home Page',
			uid: 'home_page',
		});
	});
}
