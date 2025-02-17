import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Taxonomy from '../taxonomies/Taxonomy.js';
import type Term from './Term.js';

export default async function update(
	client: Client,
	taxonomyUid: Taxonomy['uid'],
	termUid: Term['uid'],
	name: string,
) {
	const { error, response } = await client.PUT(
		'/v3/taxonomies/{taxonomy_uid}/terms/{term_uid}',
		{
			body: { term: { name } },
			params: {
				path: {
					taxonomy_uid: taxonomyUid,
					term_uid: termUid,
				},
			},
		},
	);

	const msg = `Failed to update term: ${termUid} in ${taxonomyUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
