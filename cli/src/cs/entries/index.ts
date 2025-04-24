import type Client from '../api/Client.js';
import readPaginatedItems from '../api/paginate/readPaginatedItems.js';
import type { ContentType } from '../content-types/Types.js';
import typecheckArray from '../typecheckArray.js';
import type { Schema } from '../Types.js';
import isEmptyEntry from './lib/isEmptyEntry.js';
import { isEntry, key } from './Types.js';

export default async function index(
	client: Client,
	globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
) {
	return readPaginatedItems(
		`${contentType.title} entries`,
		key,
		fetchFn.bind(null, contentType.uid, client),
		mapFn.bind(null, globalFieldsByUid, contentType),
	);
}

async function fetchFn(contentTypeUid: string, client: Client, skip: number) {
	return client.GET('/v3/content_types/{content_type_uid}/entries', {
		params: {
			path: { content_type_uid: contentTypeUid },
			query: {
				include_count: 'true',
				include_publish_details: 'false',
				limit: 100,
				...(skip > 0 ? { skip } : {}),
			},
		},
	});
}

function mapFn(
	globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
	o: Record<string, unknown>,
) {
	const { count, entries: rawItems } = o;

	if (!typecheckArray(isEntry, `${contentType.title} entries`, rawItems)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items: rawItems.filter(
			(x) => !isEmptyEntry(globalFieldsByUid, contentType, x),
		),
		processedItems: rawItems.length,
		...(typeof count === 'number' ? { count } : {}),
	};
}
