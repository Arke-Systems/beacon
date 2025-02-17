import type Client from '../api/Client.js';
import readPaginatedItems from '../api/readPaginatedItems.js';
import typecheckArray from '../typecheckArray.js';
import { isSchema, itemKey } from '../Types.js';

export default async function index(client: Client) {
	return readPaginatedItems(
		'content types',
		itemKey,
		fetchFn.bind(null, client),
		mapFn.bind(null),
	);
}

async function fetchFn(client: Client, skip = 0) {
	return client.GET('/v3/content_types', {
		params: {
			query: {
				include_count: 'true',
				include_global_field_schema: 'false',
				...(skip > 0 ? { skip } : {}),
			},
		},
	});
}

function mapFn(data: Record<string, unknown>) {
	const { content_types: items, count } = data;

	if (!typecheckArray(isSchema, 'content types', items)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items,
		...(typeof count === 'number' ? { count } : {}),
	};
}
