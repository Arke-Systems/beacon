import { isDeepStrictEqual, styleText } from 'node:util';
import getUi from '../../schema/lib/SchemaUi.js';
import type Client from '../api/Client.js';
import readPaginatedItems from '../api/readPaginatedItems.js';
import typecheckArray from '../typecheckArray.js';
import { isEntry, key, type Entry } from './Types.js';

export default async function index(client: Client, contentTypeUid: string) {
	return readPaginatedItems(
		`${contentTypeUid} entries`,
		key,
		fetchFn.bind(null, contentTypeUid, client),
		mapFn.bind(null, contentTypeUid),
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

function mapFn(contentTypeUid: string, o: Record<string, unknown>) {
	const { count, entries: rawItems } = o;

	if (!typecheckArray(isEntry, `${contentTypeUid} entries`, rawItems)) {
		throw new Error('Invalid response from Contentstack');
	}

	return {
		items: rawItems.filter((x) => !isEmptyEntry(contentTypeUid, x)),
		processedItems: rawItems.length,
		...(typeof count === 'number' ? { count } : {}),
	};
}

// We are encountering some instances with partially-formed entries. These have
// no data in any field, including the title field, which comes across as an
// empty string. This causes issues when there are two or more of these because
// the empty string is still a valid key value, but we can't deal with
// duplicate keys.
//
// I do not know how these entries come into being and I have not been able to
// replicate the issue. This code is an attempt to filter them out.
function isEmptyEntry(contentTypeUid: string, x: Entry): boolean {
	if (x.title) {
		return false;
	}

	const props = new Map(Object.entries(x));
	props.delete('_in_progress');
	props.delete('_version');
	props.delete('ACL');
	props.delete('created_at');
	props.delete('created_by');
	props.delete('locale');
	props.delete('uid');
	props.delete('updated_at');
	props.delete('updated_by');
	const reduced = Object.fromEntries(props);

	if (isDeepStrictEqual(reduced, { tags: [], title: '' })) {
		getUi().warn(
			'Empty',
			styleText('yellowBright', contentTypeUid),
			'entry detected and filtered out:',
			`[${styleText('yellowBright', x.uid)}]`,
			x.title
				? `(${styleText('yellowBright', x.title)})`
				: `(${styleText('dim', 'Untitled')})`,
		);

		return true;
	}

	return false;
}
