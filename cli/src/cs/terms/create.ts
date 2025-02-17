import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Taxonomy from '../taxonomies/Taxonomy.js';
import type Term from './Term.js';

export default async function create(
	client: Client,
	taxonomyUid: Taxonomy['uid'],
	term: Term,
	order: number,
) {
	const { error, response } = await client.POST(
		'/v3/taxonomies/{taxonomy_uid}/terms',
		{
			body: {
				term: {
					name: term.name,
					order: order,
					parent_uid: term.parent_uid,
					uid: term.uid,
				},
			},
			params: {
				path: {
					taxonomy_uid: taxonomyUid,
				},
			},
		},
	);

	const msg = `Failed to create term: ${term.uid} in ${taxonomyUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
