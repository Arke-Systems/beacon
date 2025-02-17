import type Client from '#cli/cs/api/Client.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function addContentType({
	client,
	currentFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const newUid = await addNewContentType(client);

		// Act
		const result = await pull(client);

		// Assert
		expect(result).toBeErrorFreeTransferResults();
		const contentTypeResult = result.get('Content Types')!;

		if (contentTypeResult.status !== 'fulfilled') {
			throw new Error('Content Types pull failed');
		}

		expect([...contentTypeResult.value.created]).toEqual([newUid]);

		const expectedPath = resolve(
			currentFixturePath,
			'content-types',
			`${newUid}.yaml`,
		);

		expect(existsSync(expectedPath)).toBe(true);
	});
}

async function addNewContentType(client: Client) {
	const uid = 'new_content_type';

	const x = await client.POST('/v3/content_types', {
		body: {
			content_type: {
				options: {
					is_page: false,
					publishable: true,
					singleton: false,
					title: 'title',
				},
				schema: [
					{
						data_type: 'text',
						display_name: 'Title',
						field_metadata: { _default: true },
						mandatory: true,
						multiple: false,
						uid: 'title',
						unique: false,
					},
				],
				title: 'New Content Type',
				uid,
			},
		},
	});

	if (!x.response.ok) {
		throw new Error('Failed to create new content type');
	}

	return uid;
}
