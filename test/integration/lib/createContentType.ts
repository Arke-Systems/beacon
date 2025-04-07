import type Client from '#cli/cs/api/Client.js';
import deleteContentType from '#cli/cs/content-types/delete.js';
import importContentType from '#cli/cs/content-types/import.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Schema } from '#cli/cs/Types.js';
import transform from '#cli/dto/schema/toCs.js';
import { randomUUID } from 'node:crypto';
import { parse } from 'yaml';
import readFixture from '../../fixtures/readFixture.js';

export default async function createContentType(
	client: Client,
): Promise<AsyncDisposable & Schema> {
	const fixtureYaml = await readFixture('test-content-type.yaml');
	const title = randomUUID();
	const uid = title.toLowerCase().replaceAll('-', '_');

	const fixture: Schema = {
		...(parse(fixtureYaml) as ContentType),
		title,
		uid,
	};

	await importContentType(client, transform(fixture), false);

	return {
		...fixture,

		async [Symbol.asyncDispose]() {
			await deleteContentType(client, uid);
		},
	};
}
