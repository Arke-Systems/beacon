import type Client from '#cli/cs/api/Client.js';
import { afterAll, beforeAll } from 'vitest';
import createContentType from './createContentType.js';

export default function contentTypeFixture(client: Client) {
	let contentType: Awaited<ReturnType<typeof createContentType>> | undefined;

	beforeAll(async () => {
		contentType = await createContentType(client);
	});

	afterAll(async () => {
		if (contentType) {
			await contentType[Symbol.asyncDispose]();
		}
	});

	return {
		get uid() {
			if (!contentType) {
				throw new Error('Content type not initialized');
			}

			return contentType.uid;
		},
	};
}
