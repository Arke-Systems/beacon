import type Client from '../api/Client.js';
import readPaginatedItems from '../api/paginate/readPaginatedItems.js';
import typecheckArray from '../typecheckArray.js';
import { isLabel, key } from './Label.js';

export default async function index(client: Client) {
	return readPaginatedItems('labels', key, fetchFn.bind(null, client), mapFn);
}

async function fetchFn(client: Client, skip: number) {
	return client.GET('/v3/labels', {
		params: {
			query: {
				include_count: 'true',
				...(skip > 0 ? { skip: skip.toString() } : {}),
			},
		},
	});
}

function mapFn(o: Record<string, unknown>) {
	const { count, labels: items } = o;

	if (!typecheckArray(isLabel, 'labels', items)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items,
		...(typeof count === 'number' ? { count } : {}),
	};
}
