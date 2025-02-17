import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';

export default async function deleteTaxonomy(client: Client, uid: string) {
	const { error, response } = await client.DELETE(
		'/v3/taxonomies/{taxonomy_uid}',
		{
			params: {
				path: { taxonomy_uid: uid },
				query: { force: 'true' },
			},
		},
	);

	const msg = `Failed to delete taxonomy: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
