import type Client from '#cli/cs/api/Client.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pull from '#cli/schema/pull.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import type { WorkflowFixtures } from '../lib/WorkflowTestContext.js';

export default async function deleteContentType({
	client,
	currentFixturePath,
	ui,
}: WorkflowFixtures) {
	return Store.run(ui, async () => {
		// Arrange
		const deletedUid = await deleteCt(client);

		// Act
		const result = await pull(client);

		// Assert
		expect(result).toBeErrorFreeTransferResults();
		const contentTypeResult = result.get('Content Types')!;

		if (contentTypeResult.status !== 'fulfilled') {
			throw new Error('Content Types pull failed');
		}

		expect([...contentTypeResult.value.deleted]).toEqual([deletedUid]);

		const expectedPath = resolve(
			currentFixturePath,
			'content-types',
			`${deletedUid}.yaml`,
		);

		expect(existsSync(expectedPath)).toBe(false);
	});
}

async function deleteCt(client: Client) {
	const uid = 'new_content_type';

	const x = await client.DELETE('/v3/content_types/{content_type_uid}', {
		params: {
			path: {
				content_type_uid: uid,
			},
		},
	});

	if (!x.response.ok) {
		throw new Error('Failed to create new content type');
	}

	return uid;
}
