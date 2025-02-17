import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Taxonomy from './Taxonomy.js';

export default async function update(client: Client, content: Taxonomy) {
	const { error, response } = await client.PUT(
		'/v3/taxonomies/{taxonomy_uid}',
		{
			body: {
				taxonomy: {
					description: content.description,
					name: content.name,
				},
			},
			params: {
				path: {
					taxonomy_uid: content.uid,
				},
			},
		},
	);

	const msg = `Failed to update taxonomy: ${content.uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
