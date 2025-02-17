import type Client from '../api/Client.js';
import readPaginatedItems from '../api/readPaginatedItems.js';
import typecheckArray from '../typecheckArray.js';
import { isTaxonomy, key } from './Taxonomy.js';

export default async function index(client: Client) {
	return readPaginatedItems(
		'taxonomies',
		key,
		fetchFn.bind(null, client),
		mapFn,
	);
}

async function fetchFn(client: Client, skip: number) {
	return client.GET('/v3/taxonomies', {
		params: {
			query: {
				include_count: 'true',
				include_referenced_entries_count: 'false',
				include_terms_count: 'false',
				limit: '100',
				...(skip > 0 ? { skip: skip.toString() } : {}),
			},
		},
	});
}

function mapFn(o: Record<string, unknown>) {
	const { count, taxonomies: items } = o;

	if (!typecheckArray(isTaxonomy, 'taxonomies', items)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items,
		...(typeof count === 'number' ? { count } : {}),
	};
}
