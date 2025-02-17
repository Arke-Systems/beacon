import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Taxonomy from '../taxonomies/Taxonomy.js';
import type Term from './Term.js';

export default async function remove(
	client: Client,
	taxonomyUid: Taxonomy['uid'],
	termUid: Term['uid'],
) {
	const { error, response } = await client.DELETE(
		'/v3/taxonomies/{taxonomy_uid}/terms/{term_uid}',
		{
			params: {
				path: {
					taxonomy_uid: taxonomyUid,
					term_uid: termUid,
				},
				query: { force: 'true' },
			},
		},
	);

	const msg = `Failed to remove term: ${termUid} in ${taxonomyUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
