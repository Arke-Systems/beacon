import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import fileUploadInit from '../api/fileUploadInit.js';
import type TaxonomyDetail from './TaxonomyDetail.js';

export default async function importTaxonomy(
	client: Client,
	content: TaxonomyDetail,
) {
	const { error, response } = await client.POST('/v3/taxonomies/import', {
		// Weird casting is here because the OpenAPI definition is wrong.
		...(fileUploadInit as unknown as Record<string, string>),
		body: { taxonomy: JSON.stringify(content) } as unknown as undefined,
	});

	const msg = `Failed to import taxonomy: ${content.taxonomy.uid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}
}
