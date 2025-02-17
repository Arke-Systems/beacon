import type Client from '../api/Client.js';
import type { operations } from '../api/cma-openapi-3.js';
import ContentstackError from '../api/ContentstackError.js';
import type Taxonomy from '../taxonomies/Taxonomy.js';
import type Term from './Term.js';

export default async function update(
	client: Client,
	taxonomyUid: Taxonomy['uid'],
	termUid: Term['uid'],
	parentUid: Term['parent_uid'],
	order: number,
) {
	const { error, response } = await client.PUT(
		'/v3/taxonomies/{taxonomy_uid}/terms/{term_uid}/move',
		{
			body: {
				term: {
					order,
					parent_uid: parentUid,
				},
			},
			params: {
				path: {
					taxonomy_uid: taxonomyUid,
					term_uid: termUid,
				},
				query: { force: 'true' },
				// "as" needed here because the type definition includes a required
				// "header" property with an invalid value; it demands a header named
				// "Content-Type " with the extra space at the end. The actual
				// content type header is added automatically, and the space is an
				// error in the specs, so this can be ignored.
			} as operations['move/reorderaterm']['parameters'],
		},
	);

	const msg = `Failed to update term: ${termUid} in ${taxonomyUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
