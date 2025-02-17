import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import typecheckArray from '../typecheckArray.js';
import type { Schema } from '../Types.js';
import { isSchema } from '../Types.js';

export default async function index(
	client: Client,
): Promise<ReadonlyMap<Schema['uid'], Schema>> {
	const response = await client.GET('/v3/global_fields');
	ContentstackError.throwIfError(response.error, 'Failed to get global fields');

	const result = response.data as unknown;

	if (
		typeof result !== 'object' ||
		result === null ||
		!('global_fields' in result)
	) {
		throw new Error('Invalid response from Contentstack');
	}

	const { global_fields: schemas } = result;

	if (!typecheckArray(isSchema, 'global fields', schemas)) {
		throw new Error('Invalid response from Contentstack');
	}

	return schemas.reduce(
		(acc, schema) => acc.set(schema.uid, schema),
		new Map(),
	);
}
